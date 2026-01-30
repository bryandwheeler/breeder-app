// Firebase Cloud Functions for Stripe Billing and Email Automation
// Last updated: 2026-01-29
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Lazy-load Stripe to avoid deployment timeout
let stripeClient = null;
function getStripeClient() {
  if (stripeClient === null && process.env.STRIPE_SECRET_KEY) {
    stripeClient = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

// 1. Create Stripe Customer on signup
// Also ensures user profile exists even if Stripe fails
exports.createStripeCustomer = functions.auth.user().onCreate(async (user) => {
  const now = new Date().toISOString();
  const userRef = db.collection('users').doc(user.uid);

  // First, ensure the user profile exists with basic data
  // This should never fail and ensures the user can access the app
  try {
    await userRef.set({
      email: user.email || 'unknown',
      displayName: user.displayName || 'Unknown User',
      photoURL: user.photoURL || null,
      createdAt: now,
      lastLogin: now,
      isActive: true,
      role: 'user',
    }, { merge: true });
    console.log(`User profile created for ${user.uid}`);
  } catch (profileError) {
    console.error(`Failed to create user profile for ${user.uid}:`, profileError);
    // Don't throw - continue to try Stripe
  }

  // Then try to create Stripe customer (optional - app works without it)
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      const customer = await getStripeClient().customers.create({
        email: user.email,
        metadata: { uid: user.uid },
      });
      await userRef.set(
        { stripeCustomerId: customer.id },
        { merge: true }
      );
      console.log(`Stripe customer created for ${user.uid}: ${customer.id}`);
    } else {
      console.log('Stripe not configured, skipping customer creation');
    }
  } catch (stripeError) {
    console.error(`Failed to create Stripe customer for ${user.uid}:`, stripeError);
    // Don't throw - user profile was already created
  }
});

// 2. Create Stripe Checkout Session
exports.createCheckoutSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated');
    const { priceId, successUrl, cancelUrl } = data;
    const userRef = db.collection('users').doc(context.auth.uid);
    const userDoc = await userRef.get();
    const customerId = userDoc.data().stripeCustomerId;
    const session = await getStripeClient().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return { sessionId: session.id };
  }
);

// 3. Create Stripe Customer Portal Session
exports.createPortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated');
  const { returnUrl } = data;
  const userRef = db.collection('users').doc(context.auth.uid);
  const userDoc = await userRef.get();
  const customerId = userDoc.data().stripeCustomerId;
  const session = await getStripeClient().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return { url: session.url };
});

// 4. Stripe Webhook to update Firestore
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = getStripeClient().webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Handle subscription events
  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.created'
  ) {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const userSnap = await db
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .get();
    if (!userSnap.empty) {
      const userRef = userSnap.docs[0].ref;
      await userRef.set(
        {
          subscriptionTier:
            subscription.items.data[0].price.nickname || 'unknown',
          subscriptionStatus: subscription.status,
          subscriptionCurrentPeriodEnd: subscription.current_period_end,
        },
        { merge: true }
      );
    }
  }
  res.json({ received: true });
});

// ========== EMAIL AUTOMATION FUNCTIONS ==========

// 5. Process Scheduled Emails (runs every minute)
exports.processScheduledEmails = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const nowISO = new Date().toISOString();

    try {
      // Query for pending emails that are due to be sent
      const pendingEmails = await db
        .collection('scheduledEmails')
        .where('status', '==', 'pending')
        .where('scheduledFor', '<=', nowISO)
        .limit(50) // Process max 50 emails per run
        .get();

      console.log(`Found ${pendingEmails.size} scheduled emails to process`);

      const sendPromises = pendingEmails.docs.map(async (doc) => {
        const email = doc.data();
        const emailId = doc.id;

        try {
          // Get the user's email integration
          const integrationDoc = await db
            .collection('emailIntegrations')
            .doc(email.userId)
            .get();

          if (!integrationDoc.exists) {
            throw new Error('Email integration not found for user');
          }

          const integration = integrationDoc.data();

          if (!integration.accessToken) {
            throw new Error('Access token not available');
          }

          // Send the email using Gmail API
          if (integration.provider === 'gmail') {
            await sendGmailEmail(integration.accessToken, email);
          } else if (integration.provider === 'outlook') {
            await sendOutlookEmail(integration.accessToken, email);
          } else {
            throw new Error(`Unsupported email provider: ${integration.provider}`);
          }

          // Update status to sent
          await doc.ref.update({
            status: 'sent',
            sentAt: nowISO,
            updatedAt: nowISO,
          });

          console.log(`Successfully sent scheduled email ${emailId}`);
        } catch (error) {
          console.error(`Error sending scheduled email ${emailId}:`, error);

          // Update status to failed
          await doc.ref.update({
            status: 'failed',
            error: error.message,
            updatedAt: nowISO,
          });
        }
      });

      await Promise.all(sendPromises);
      console.log(`Processed ${pendingEmails.size} scheduled emails`);
    } catch (error) {
      console.error('Error processing scheduled emails:', error);
    }
  });

// Helper function to send Gmail email
async function sendGmailEmail(accessToken, email) {
  const fetch = (await import('node-fetch')).default;

  // Build the raw email message
  const messageParts = [
    `To: ${email.to.join(', ')}`,
    email.cc && email.cc.length > 0 ? `Cc: ${email.cc.join(', ')}` : null,
    `Subject: ${email.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    email.htmlBody || email.body.replace(/\n/g, '<br>'),
  ].filter(Boolean);

  const message = messageParts.join('\r\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gmail API error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

// Helper function to send Outlook email
async function sendOutlookEmail(accessToken, email) {
  const fetch = (await import('node-fetch')).default;

  const message = {
    subject: email.subject,
    body: {
      contentType: 'HTML',
      content: email.htmlBody || email.body.replace(/\n/g, '<br>'),
    },
    toRecipients: email.to.map((addr) => ({
      emailAddress: { address: addr },
    })),
  };

  if (email.cc && email.cc.length > 0) {
    message.ccRecipients = email.cc.map((addr) => ({
      emailAddress: { address: addr },
    }));
  }

  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Outlook API error: ${error.error?.message || 'Unknown error'}`);
  }

  return true;
}

// 6. Workflow Trigger Listener - Customer Created
exports.onCustomerCreated = functions.firestore
  .document('customers/{customerId}')
  .onCreate(async (snap, context) => {
    const customer = snap.data();
    const customerId = context.params.customerId;

    try {
      // Find all active workflows with customer_created trigger
      const workflowsSnapshot = await db
        .collection('workflows')
        .where('userId', '==', customer.breederId)
        .where('isActive', '==', true)
        .where('trigger.type', '==', 'customer_created')
        .get();

      console.log(`Found ${workflowsSnapshot.size} workflows for customer_created trigger`);

      // Execute each workflow
      const executePromises = workflowsSnapshot.docs.map((workflowDoc) => {
        return executeWorkflow(workflowDoc.id, workflowDoc.data(), {
          customer: { ...customer, id: customerId },
        });
      });

      await Promise.all(executePromises);
    } catch (error) {
      console.error('Error processing customer_created workflows:', error);
    }
  });

// 7. Workflow Trigger Listener - Customer Updated
exports.onCustomerUpdated = functions.firestore
  .document('customers/{customerId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const customerId = context.params.customerId;

    // Check if status changed
    if (before.type !== after.type) {
      try {
        const workflowsSnapshot = await db
          .collection('workflows')
          .where('userId', '==', after.breederId)
          .where('isActive', '==', true)
          .where('trigger.type', '==', 'customer_status_changed')
          .get();

        const executePromises = workflowsSnapshot.docs.map((workflowDoc) => {
          const workflow = workflowDoc.data();

          // Check if trigger matches the new status
          if (workflow.trigger.toStatus && workflow.trigger.toStatus !== after.type) {
            return Promise.resolve();
          }

          return executeWorkflow(workflowDoc.id, workflow, {
            customer: { ...after, id: customerId },
            previousStatus: before.type,
          });
        });

        await Promise.all(executePromises);
      } catch (error) {
        console.error('Error processing customer_status_changed workflows:', error);
      }
    }
  });

// Helper function to execute a workflow
async function executeWorkflow(workflowId, workflow, context) {
  const nowISO = new Date().toISOString();

  // Create execution log
  const logRef = db.collection('workflowExecutionLogs').doc();
  await logRef.set({
    id: logRef.id,
    workflowId,
    userId: workflow.userId,
    triggeredAt: nowISO,
    status: 'pending',
    context,
  });

  try {
    // Check conditions
    if (workflow.conditions && workflow.conditions.length > 0) {
      const conditionsMet = evaluateConditions(workflow.conditions, context);
      if (!conditionsMet) {
        await logRef.update({
          status: 'skipped',
          result: 'Conditions not met',
          completedAt: nowISO,
        });
        return;
      }
    }

    // Execute actions
    const actionResults = [];
    for (const action of workflow.actions) {
      try {
        const result = await executeAction(action, context, workflow.userId);
        actionResults.push({ action: action.type, success: true, result });
      } catch (error) {
        actionResults.push({
          action: action.type,
          success: false,
          error: error.message,
        });
      }
    }

    // Update execution log
    await logRef.update({
      status: 'completed',
      result: actionResults,
      completedAt: nowISO,
    });

    // Update workflow stats
    await db
      .collection('workflows')
      .doc(workflowId)
      .update({
        timesTriggered: admin.firestore.FieldValue.increment(1),
        lastTriggered: nowISO,
        updatedAt: nowISO,
      });

    console.log(`Workflow ${workflowId} executed successfully`);
  } catch (error) {
    console.error(`Error executing workflow ${workflowId}:`, error);
    await logRef.update({
      status: 'failed',
      error: error.message,
      completedAt: nowISO,
    });
  }
}

// Helper function to evaluate conditions
function evaluateConditions(conditions, context) {
  for (const condition of conditions) {
    switch (condition.type) {
      case 'customer_type':
        if (condition.operator === 'equals') {
          if (context.customer?.type !== condition.value) return false;
        }
        break;

      case 'has_email':
        if (condition.operator === 'exists') {
          if (!context.customer?.email) return false;
        }
        break;

      case 'tag_present':
        if (condition.operator === 'contains') {
          if (!context.customer?.tags?.includes(condition.value)) return false;
        }
        break;

      // Add more condition types as needed
      default:
        console.warn(`Unknown condition type: ${condition.type}`);
    }
  }
  return true;
}

// Helper function to execute workflow action
async function executeAction(action, context, userId) {
  const nowISO = new Date().toISOString();

  switch (action.type) {
    case 'send_email':
      if (action.templateId && context.customer) {
        // Get email template
        const templateDoc = await db
          .collection('emailTemplates')
          .doc(action.templateId)
          .get();

        if (!templateDoc.exists) {
          throw new Error(`Email template ${action.templateId} not found`);
        }

        const template = templateDoc.data();

        // Get breeder profile for variable replacement
        const profileDoc = await db
          .collection('breederProfiles')
          .doc(userId)
          .get();

        const profile = profileDoc.exists ? profileDoc.data() : null;

        // Simple variable replacement (server-side)
        let subject = template.subject;
        let body = template.body;

        if (context.customer) {
          subject = replaceVariables(subject, context.customer, profile);
          body = replaceVariables(body, context.customer, profile);
        }

        // Schedule immediate email send
        await db.collection('scheduledEmails').add({
          userId,
          customerId: context.customer.id,
          to: [context.customer.email],
          subject,
          body,
          htmlBody: body.replace(/\n/g, '<br>'),
          scheduledFor: nowISO,
          status: 'pending',
          source: 'workflow',
          workflowId: context.workflowId,
          createdAt: nowISO,
          updatedAt: nowISO,
        });

        return { emailScheduled: true };
      }
      break;

    case 'schedule_email':
      if (action.templateId && action.delayDays && context.customer) {
        const templateDoc = await db
          .collection('emailTemplates')
          .doc(action.templateId)
          .get();

        if (!templateDoc.exists) {
          throw new Error(`Email template ${action.templateId} not found`);
        }

        const template = templateDoc.data();
        const profileDoc = await db
          .collection('breederProfiles')
          .doc(userId)
          .get();

        const profile = profileDoc.exists ? profileDoc.data() : null;

        let subject = replaceVariables(template.subject, context.customer, profile);
        let body = replaceVariables(template.body, context.customer, profile);

        // Calculate scheduled time
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + action.delayDays);

        await db.collection('scheduledEmails').add({
          userId,
          customerId: context.customer.id,
          to: [context.customer.email],
          subject,
          body,
          htmlBody: body.replace(/\n/g, '<br>'),
          scheduledFor: scheduledDate.toISOString(),
          status: 'pending',
          source: 'workflow',
          workflowId: context.workflowId,
          createdAt: nowISO,
          updatedAt: nowISO,
        });

        return { emailScheduled: true, scheduledFor: scheduledDate.toISOString() };
      }
      break;

    case 'add_tag':
      if (action.tagName && context.customer) {
        const customerRef = db.collection('customers').doc(context.customer.id);
        const customerDoc = await customerRef.get();

        if (customerDoc.exists) {
          const tags = customerDoc.data().tags || [];
          if (!tags.includes(action.tagName)) {
            await customerRef.update({
              tags: admin.firestore.FieldValue.arrayUnion(action.tagName),
              updatedAt: nowISO,
            });
          }
        }

        return { tagAdded: action.tagName };
      }
      break;

    case 'change_status':
      if (action.newStatus && context.customer) {
        await db
          .collection('customers')
          .doc(context.customer.id)
          .update({
            type: action.newStatus,
            updatedAt: nowISO,
          });

        return { statusChanged: action.newStatus };
      }
      break;

    default:
      console.warn(`Action type ${action.type} not implemented in Cloud Functions`);
      return { actionNotImplemented: action.type };
  }

  return { executed: false };
}

// Admin function to fix missing user profiles
exports.fixMissingUserProfile = functions.https.onCall(async (data, context) => {
  // Only allow admins to call this function
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Check if caller is admin
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin');
  }

  const { uid, email, displayName } = data;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid is required');
  }

  // Check if user profile already exists
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    return {
      success: true,
      message: 'User profile already exists',
      existed: true,
      data: userDoc.data()
    };
  }

  // Create the missing user profile
  const now = new Date().toISOString();
  const userData = {
    email: email || 'unknown',
    displayName: displayName || 'Unknown User',
    photoURL: null,
    lastLogin: now,
    createdAt: now,
    isActive: true,
    role: 'user',
  };

  await userRef.set(userData);

  return {
    success: true,
    message: 'User profile created successfully',
    existed: false,
    data: userData
  };
});

// Simple variable replacement for server-side use
function replaceVariables(text, customer, profile) {
  let result = text;

  // Customer variables
  if (customer) {
    result = result.replace(/{{customer_name}}/g, customer.name || '');
    result = result.replace(/{{customer_first_name}}/g, customer.name?.split(' ')[0] || '');
    result = result.replace(/{{customer_email}}/g, customer.email || '');
    result = result.replace(/{{customer_phone}}/g, customer.phone || '');
  }

  // Breeder profile variables
  if (profile) {
    result = result.replace(/{{breeder_name}}/g, profile.breederName || '');
    result = result.replace(/{{kennel_name}}/g, profile.kennelName || '');
    result = result.replace(/{{breeder_email}}/g, profile.email || '');
    result = result.replace(/{{breeder_phone}}/g, profile.phone || '');
    result = result.replace(/{{breeder_website}}/g, profile.website || '');
    result = result.replace(/{{breed}}/g, profile.primaryBreed || '');
  }

  return result;
}

// ========== SENDGRID NEWSLETTER FUNCTIONS ==========

// Lazy-load SendGrid to avoid deployment timeout
let sgMail = null;
function getSendGridClient() {
  if (sgMail === null && process.env.SENDGRID_API_KEY) {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  return sgMail;
}

// Newsletter variable replacement for subscribers
function replaceNewsletterVariables(text, subscriber, additionalData = {}) {
  let result = text;

  if (subscriber) {
    result = result.replace(/{{email}}/g, subscriber.email || '');
    result = result.replace(/{{first_name}}/g, subscriber.firstName || '');
    result = result.replace(/{{last_name}}/g, subscriber.lastName || '');
    result = result.replace(/{{full_name}}/g, `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim() || 'Subscriber');
  }

  // Additional custom fields
  if (subscriber?.customFields) {
    for (const [key, value] of Object.entries(subscriber.customFields)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }
  }

  // Additional data (like unsubscribe links, etc.)
  for (const [key, value] of Object.entries(additionalData)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }

  return result;
}

// Generate tracking URLs
function generateTrackingUrl(baseUrl, campaignId, subscriberId, type) {
  const params = new URLSearchParams({
    cid: campaignId,
    sid: subscriberId,
    t: type,
  });
  return `${baseUrl}/api/email/track?${params.toString()}`;
}

// Send a single email via SendGrid
async function sendSendGridEmail(to, subject, html, options = {}) {
  const client = getSendGridClient();
  if (!client) {
    throw new Error('SendGrid not configured');
  }

  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@expert-breeder.com',
      name: process.env.SENDGRID_FROM_NAME || 'Expert Breeder',
    },
    subject,
    html,
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true },
    },
    ...options,
  };

  return client.send(msg);
}

// 10. Send Newsletter Campaign (callable function)
exports.sendNewsletterCampaign = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { campaignId } = data;
  if (!campaignId) {
    throw new functions.https.HttpsError('invalid-argument', 'campaignId is required');
  }

  try {
    // Get the campaign
    const campaignDoc = await db.collection('emailCampaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }

    const campaign = campaignDoc.data();

    // Check if user owns the campaign or is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const isAdmin = userDoc.exists && userDoc.data().role === 'admin';
    if (campaign.ownerId !== context.auth.uid && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    }

    // Check campaign status
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new functions.https.HttpsError('failed-precondition', 'Campaign is not in a sendable state');
    }

    // Update campaign status to sending
    const nowISO = new Date().toISOString();
    await campaignDoc.ref.update({
      status: 'sending',
      sentAt: nowISO,
      updatedAt: nowISO,
    });

    // Queue the campaign for processing
    await db.collection('newsletterCampaignQueue').add({
      campaignId,
      status: 'pending',
      createdAt: nowISO,
    });

    return { success: true, message: 'Campaign queued for sending' };
  } catch (error) {
    console.error('Error sending newsletter campaign:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 11. Process Newsletter Campaign Queue (runs every minute)
exports.processNewsletterCampaigns = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    if (!getSendGridClient()) {
      console.log('SendGrid not configured, skipping newsletter processing');
      return;
    }

    const nowISO = new Date().toISOString();

    try {
      // Get pending campaigns
      const queueSnapshot = await db
        .collection('newsletterCampaignQueue')
        .where('status', '==', 'pending')
        .limit(5)
        .get();

      if (queueSnapshot.empty) {
        return;
      }

      for (const queueDoc of queueSnapshot.docs) {
        const { campaignId } = queueDoc.data();

        try {
          // Mark as processing
          await queueDoc.ref.update({ status: 'processing', startedAt: nowISO });

          // Get campaign details
          const campaignDoc = await db.collection('emailCampaigns').doc(campaignId).get();
          if (!campaignDoc.exists) {
            await queueDoc.ref.update({ status: 'failed', error: 'Campaign not found' });
            continue;
          }

          const campaign = campaignDoc.data();

          // Get subscribers from target lists
          const subscriberIds = new Set();
          for (const listId of campaign.targetListIds) {
            const subscribersSnapshot = await db
              .collection('newsletterSubscribers')
              .where('listIds', 'array-contains', listId)
              .where('status', '==', 'active')
              .get();

            subscribersSnapshot.docs.forEach(doc => subscriberIds.add(doc.id));
          }

          // Filter by tags if specified
          let subscribers = [];
          for (const id of subscriberIds) {
            const subDoc = await db.collection('newsletterSubscribers').doc(id).get();
            if (subDoc.exists) {
              const sub = { id: subDoc.id, ...subDoc.data() };

              // Check include/exclude tags
              if (campaign.targetTags?.include?.length > 0) {
                if (!campaign.targetTags.include.some(tag => sub.tags?.includes(tag))) {
                  continue;
                }
              }
              if (campaign.targetTags?.exclude?.length > 0) {
                if (campaign.targetTags.exclude.some(tag => sub.tags?.includes(tag))) {
                  continue;
                }
              }

              subscribers.push(sub);
            }
          }

          console.log(`Sending campaign ${campaignId} to ${subscribers.length} subscribers`);

          let sent = 0;
          let failed = 0;
          const baseUrl = process.env.APP_URL || 'https://expert-breeder.web.app';

          // Send emails in batches
          const batchSize = 100;
          for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);

            await Promise.all(batch.map(async (subscriber) => {
              try {
                // Generate personalized content
                const unsubscribeUrl = `${baseUrl}/unsubscribe?sid=${subscriber.id}&cid=${campaignId}`;
                const trackingPixel = generateTrackingUrl(baseUrl, campaignId, subscriber.id, 'open');

                const personalizedSubject = replaceNewsletterVariables(campaign.subject, subscriber);
                let personalizedHtml = replaceNewsletterVariables(campaign.htmlContent || campaign.content, subscriber, {
                  unsubscribe_url: unsubscribeUrl,
                });

                // Add tracking pixel for opens
                personalizedHtml += `<img src="${trackingPixel}" width="1" height="1" style="display:none" alt="" />`;

                await sendSendGridEmail(
                  subscriber.email,
                  personalizedSubject,
                  personalizedHtml,
                  {
                    customArgs: {
                      campaignId,
                      subscriberId: subscriber.id,
                    },
                  }
                );

                // Update subscriber stats
                await db.collection('newsletterSubscribers').doc(subscriber.id).update({
                  emailsSent: admin.firestore.FieldValue.increment(1),
                  lastEmailAt: nowISO,
                  updatedAt: nowISO,
                });

                sent++;
              } catch (error) {
                console.error(`Failed to send to ${subscriber.email}:`, error.message);
                failed++;
              }
            }));
          }

          // Update campaign stats
          await campaignDoc.ref.update({
            status: 'sent',
            'stats.sent': sent,
            sentAt: nowISO,
            updatedAt: nowISO,
          });

          // Mark queue item complete
          await queueDoc.ref.update({
            status: 'completed',
            completedAt: nowISO,
            result: { sent, failed },
          });

          console.log(`Campaign ${campaignId} completed: ${sent} sent, ${failed} failed`);
        } catch (error) {
          console.error(`Error processing campaign ${campaignId}:`, error);
          await queueDoc.ref.update({
            status: 'failed',
            error: error.message,
            completedAt: nowISO,
          });
        }
      }
    } catch (error) {
      console.error('Error in processNewsletterCampaigns:', error);
    }
  });

// 12. Process Scheduled Newsletter Campaigns
exports.processScheduledNewsletterCampaigns = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const nowISO = new Date().toISOString();

    try {
      // Find campaigns that are scheduled and due
      const scheduledCampaigns = await db
        .collection('emailCampaigns')
        .where('status', '==', 'scheduled')
        .where('scheduledFor', '<=', nowISO)
        .limit(10)
        .get();

      for (const campaignDoc of scheduledCampaigns.docs) {
        // Queue each campaign for sending
        await db.collection('newsletterCampaignQueue').add({
          campaignId: campaignDoc.id,
          status: 'pending',
          createdAt: nowISO,
        });

        await campaignDoc.ref.update({
          status: 'sending',
          updatedAt: nowISO,
        });

        console.log(`Scheduled campaign ${campaignDoc.id} queued for sending`);
      }
    } catch (error) {
      console.error('Error processing scheduled campaigns:', error);
    }
  });

// 13. Process Autoresponder Sequences
exports.processAutoresponderSequences = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    if (!getSendGridClient()) {
      console.log('SendGrid not configured, skipping autoresponder processing');
      return;
    }

    const nowISO = new Date().toISOString();
    const now = new Date();

    try {
      // Get all active sequence progress records that need processing
      const progressSnapshot = await db
        .collection('subscriberSequenceProgress')
        .where('status', '==', 'active')
        .where('nextEmailAt', '<=', nowISO)
        .limit(50)
        .get();

      if (progressSnapshot.empty) {
        return;
      }

      const baseUrl = process.env.APP_URL || 'https://expert-breeder.web.app';

      for (const progressDoc of progressSnapshot.docs) {
        const progress = progressDoc.data();

        try {
          // Get the sequence
          const sequenceDoc = await db.collection('autoresponderSequences').doc(progress.sequenceId).get();
          if (!sequenceDoc.exists || sequenceDoc.data().status !== 'active') {
            await progressDoc.ref.update({ status: 'paused', updatedAt: nowISO });
            continue;
          }

          // Get the next email in sequence
          const emailsSnapshot = await db
            .collection('autoresponderEmails')
            .where('sequenceId', '==', progress.sequenceId)
            .where('order', '==', progress.currentEmailIndex + 1)
            .limit(1)
            .get();

          if (emailsSnapshot.empty) {
            // No more emails, mark as completed
            await progressDoc.ref.update({
              status: 'completed',
              completedAt: nowISO,
              updatedAt: nowISO,
            });

            // Update sequence stats
            await sequenceDoc.ref.update({
              subscribersActive: admin.firestore.FieldValue.increment(-1),
              subscribersCompleted: admin.firestore.FieldValue.increment(1),
              updatedAt: nowISO,
            });
            continue;
          }

          const email = { id: emailsSnapshot.docs[0].id, ...emailsSnapshot.docs[0].data() };

          // Get subscriber
          const subscriberDoc = await db.collection('newsletterSubscribers').doc(progress.subscriberId).get();
          if (!subscriberDoc.exists || subscriberDoc.data().status !== 'active') {
            await progressDoc.ref.update({ status: 'cancelled', updatedAt: nowISO });
            await sequenceDoc.ref.update({
              subscribersActive: admin.firestore.FieldValue.increment(-1),
              updatedAt: nowISO,
            });
            continue;
          }

          const subscriber = { id: subscriberDoc.id, ...subscriberDoc.data() };

          // Generate personalized content
          const unsubscribeUrl = `${baseUrl}/unsubscribe?sid=${subscriber.id}&seq=${progress.sequenceId}`;
          const personalizedSubject = replaceNewsletterVariables(email.subject, subscriber);
          let personalizedHtml = replaceNewsletterVariables(email.htmlContent || email.content, subscriber, {
            unsubscribe_url: unsubscribeUrl,
          });

          // Add tracking pixel
          const trackingPixel = `${baseUrl}/api/email/track?seq=${progress.sequenceId}&eid=${email.id}&sid=${subscriber.id}&t=open`;
          personalizedHtml += `<img src="${trackingPixel}" width="1" height="1" style="display:none" alt="" />`;

          // Send the email
          await sendSendGridEmail(
            subscriber.email,
            personalizedSubject,
            personalizedHtml,
            {
              customArgs: {
                sequenceId: progress.sequenceId,
                emailId: email.id,
                subscriberId: subscriber.id,
              },
            }
          );

          // Calculate next email time
          const nextEmail = await db
            .collection('autoresponderEmails')
            .where('sequenceId', '==', progress.sequenceId)
            .where('order', '==', progress.currentEmailIndex + 2)
            .limit(1)
            .get();

          let nextEmailAt = null;
          if (!nextEmail.empty) {
            const nextEmailData = nextEmail.docs[0].data();
            const delayMs = (nextEmailData.delayDays || 1) * 24 * 60 * 60 * 1000;
            nextEmailAt = new Date(now.getTime() + delayMs).toISOString();
          }

          // Update progress
          await progressDoc.ref.update({
            currentEmailIndex: progress.currentEmailIndex + 1,
            lastEmailSentAt: nowISO,
            nextEmailAt,
            emailsSent: admin.firestore.FieldValue.increment(1),
            updatedAt: nowISO,
          });

          // Update email stats
          await emailsSnapshot.docs[0].ref.update({
            'stats.sent': admin.firestore.FieldValue.increment(1),
            updatedAt: nowISO,
          });

          // Update subscriber stats
          await subscriberDoc.ref.update({
            emailsSent: admin.firestore.FieldValue.increment(1),
            lastEmailAt: nowISO,
            updatedAt: nowISO,
          });

          console.log(`Sent autoresponder email ${email.id} to ${subscriber.email}`);
        } catch (error) {
          console.error(`Error processing sequence progress ${progressDoc.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in processAutoresponderSequences:', error);
    }
  });

// 14. Start Autoresponder for New Subscriber
exports.onNewsletterSubscriberCreated = functions.firestore
  .document('newsletterSubscribers/{subscriberId}')
  .onCreate(async (snap, context) => {
    const subscriber = snap.data();
    const subscriberId = context.params.subscriberId;
    const nowISO = new Date().toISOString();

    if (subscriber.status !== 'active') {
      return;
    }

    try {
      // Find autoresponders that trigger on these lists
      for (const listId of subscriber.listIds || []) {
        const sequencesSnapshot = await db
          .collection('autoresponderSequences')
          .where('triggerListId', '==', listId)
          .where('status', '==', 'active')
          .get();

        for (const sequenceDoc of sequencesSnapshot.docs) {
          const sequence = sequenceDoc.data();

          // Check if subscriber already in this sequence
          const existingProgress = await db
            .collection('subscriberSequenceProgress')
            .where('subscriberId', '==', subscriberId)
            .where('sequenceId', '==', sequenceDoc.id)
            .limit(1)
            .get();

          if (!existingProgress.empty) {
            continue;
          }

          // Get first email to calculate timing
          const firstEmail = await db
            .collection('autoresponderEmails')
            .where('sequenceId', '==', sequenceDoc.id)
            .where('order', '==', 1)
            .limit(1)
            .get();

          if (firstEmail.empty) {
            continue;
          }

          const firstEmailData = firstEmail.docs[0].data();
          const delayMs = (firstEmailData.delayDays || 0) * 24 * 60 * 60 * 1000;
          const nextEmailAt = new Date(Date.now() + delayMs).toISOString();

          // Create sequence progress
          await db.collection('subscriberSequenceProgress').add({
            subscriberId,
            sequenceId: sequenceDoc.id,
            status: 'active',
            currentEmailIndex: 0,
            emailsSent: 0,
            emailsOpened: 0,
            emailsClicked: 0,
            startedAt: nowISO,
            nextEmailAt,
            createdAt: nowISO,
            updatedAt: nowISO,
          });

          // Update sequence stats
          await sequenceDoc.ref.update({
            subscribersActive: admin.firestore.FieldValue.increment(1),
            updatedAt: nowISO,
          });

          console.log(`Started sequence ${sequenceDoc.id} for subscriber ${subscriberId}`);
        }
      }
    } catch (error) {
      console.error('Error starting autoresponders for new subscriber:', error);
    }
  });

// 15. SendGrid Webhook Handler (for tracking opens, clicks, bounces, etc.)
exports.handleSendGridWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const events = req.body;
    const nowISO = new Date().toISOString();

    if (!Array.isArray(events)) {
      return res.status(400).send('Invalid payload');
    }

    for (const event of events) {
      const {
        event: eventType,
        email,
        campaignId,
        subscriberId,
        sequenceId,
        emailId,
        url,
      } = { ...event, ...event.customArgs };

      try {
        // Record the event
        await db.collection('emailEvents').add({
          type: eventType,
          email,
          campaignId: campaignId || null,
          sequenceId: sequenceId || null,
          emailId: emailId || null,
          subscriberId: subscriberId || null,
          url: url || null,
          timestamp: nowISO,
          rawEvent: event,
        });

        // Get subscriber by email if not provided
        let subId = subscriberId;
        if (!subId && email) {
          const subSnapshot = await db
            .collection('newsletterSubscribers')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();
          if (!subSnapshot.empty) {
            subId = subSnapshot.docs[0].id;
          }
        }

        // Update stats based on event type
        switch (eventType) {
          case 'open':
            if (subId) {
              await db.collection('newsletterSubscribers').doc(subId).update({
                emailsOpened: admin.firestore.FieldValue.increment(1),
                lastOpenAt: nowISO,
                updatedAt: nowISO,
              });
            }
            if (campaignId) {
              await db.collection('emailCampaigns').doc(campaignId).update({
                'stats.opened': admin.firestore.FieldValue.increment(1),
                updatedAt: nowISO,
              });
            }
            if (sequenceId && emailId) {
              const emailRef = db.collection('autoresponderEmails').doc(emailId);
              await emailRef.update({
                'stats.opened': admin.firestore.FieldValue.increment(1),
                updatedAt: nowISO,
              });
            }
            break;

          case 'click':
            if (subId) {
              await db.collection('newsletterSubscribers').doc(subId).update({
                emailsClicked: admin.firestore.FieldValue.increment(1),
                lastClickAt: nowISO,
                updatedAt: nowISO,
              });
            }
            if (campaignId) {
              await db.collection('emailCampaigns').doc(campaignId).update({
                'stats.clicked': admin.firestore.FieldValue.increment(1),
                updatedAt: nowISO,
              });
            }
            break;

          case 'bounce':
          case 'blocked':
            if (subId) {
              const bounceType = event.type === 'bounce' && event.bounce_classification === 'hard' ? 'hard' : 'soft';
              if (bounceType === 'hard') {
                await db.collection('newsletterSubscribers').doc(subId).update({
                  status: 'bounced',
                  bouncedAt: nowISO,
                  bounceReason: event.reason || 'Unknown',
                  updatedAt: nowISO,
                });
              }
            }
            if (campaignId) {
              await db.collection('emailCampaigns').doc(campaignId).update({
                'stats.bounced': admin.firestore.FieldValue.increment(1),
                updatedAt: nowISO,
              });
            }
            break;

          case 'spamreport':
            if (subId) {
              await db.collection('newsletterSubscribers').doc(subId).update({
                status: 'complained',
                complainedAt: nowISO,
                updatedAt: nowISO,
              });
            }
            if (campaignId) {
              await db.collection('emailCampaigns').doc(campaignId).update({
                'stats.complained': admin.firestore.FieldValue.increment(1),
                updatedAt: nowISO,
              });
            }
            break;

          case 'unsubscribe':
            if (subId) {
              await db.collection('newsletterSubscribers').doc(subId).update({
                status: 'unsubscribed',
                unsubscribedAt: nowISO,
                updatedAt: nowISO,
              });
            }
            if (campaignId) {
              await db.collection('emailCampaigns').doc(campaignId).update({
                'stats.unsubscribed': admin.firestore.FieldValue.increment(1),
                updatedAt: nowISO,
              });
            }
            break;

          case 'delivered':
            if (campaignId) {
              await db.collection('emailCampaigns').doc(campaignId).update({
                'stats.delivered': admin.firestore.FieldValue.increment(1),
                updatedAt: nowISO,
              });
            }
            break;
        }
      } catch (eventError) {
        console.error('Error processing event:', eventError);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling SendGrid webhook:', error);
    res.status(500).send('Internal error');
  }
});

// 16. Send Lead Magnet Email
exports.sendLeadMagnetEmail = functions.https.onCall(async (data, context) => {
  const { email, firstName, lastName, leadMagnetId, listIds, formId } = data;

  if (!email || !leadMagnetId) {
    throw new functions.https.HttpsError('invalid-argument', 'email and leadMagnetId are required');
  }

  const nowISO = new Date().toISOString();

  try {
    // Get lead magnet
    const magnetDoc = await db.collection('leadMagnets').doc(leadMagnetId).get();
    if (!magnetDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Lead magnet not found');
    }

    const magnet = magnetDoc.data();

    // Check if subscriber exists
    let subscriberDoc = await db
      .collection('newsletterSubscribers')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    let subscriberId;
    if (subscriberDoc.empty) {
      // Create new subscriber
      const newSubscriber = await db.collection('newsletterSubscribers').add({
        email: email.toLowerCase(),
        firstName: firstName || '',
        lastName: lastName || '',
        listIds: listIds || magnet.defaultListIds || [],
        tags: magnet.tagsToAdd || [],
        status: magnet.requireDoubleOptIn ? 'pending' : 'active',
        source: 'lead_magnet',
        sourceId: leadMagnetId,
        formId: formId || null,
        engagementScore: 0,
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        createdAt: nowISO,
        updatedAt: nowISO,
      });
      subscriberId = newSubscriber.id;
    } else {
      subscriberId = subscriberDoc.docs[0].id;
      // Add to lists if not already
      const existing = subscriberDoc.docs[0].data();
      const newListIds = [...new Set([...existing.listIds, ...(listIds || magnet.defaultListIds || [])])];
      const newTags = [...new Set([...existing.tags, ...(magnet.tagsToAdd || [])])];
      await subscriberDoc.docs[0].ref.update({
        listIds: newListIds,
        tags: newTags,
        updatedAt: nowISO,
      });
    }

    // Update lead magnet download count
    await magnetDoc.ref.update({
      downloadCount: admin.firestore.FieldValue.increment(1),
      updatedAt: nowISO,
    });

    // Update form stats if form ID provided
    if (formId) {
      await db.collection('signupForms').doc(formId).update({
        submissions: admin.firestore.FieldValue.increment(1),
        conversions: admin.firestore.FieldValue.increment(1),
        updatedAt: nowISO,
      });
    }

    // Send the lead magnet email
    if (getSendGridClient()) {
      const baseUrl = process.env.APP_URL || 'https://expert-breeder.web.app';
      const downloadUrl = magnet.fileUrl || `${baseUrl}/api/lead-magnet/${leadMagnetId}/download?sid=${subscriberId}`;

      const emailHtml = magnet.deliveryEmailHtml || `
        <h1>Here's your download!</h1>
        <p>Hi ${firstName || 'there'},</p>
        <p>Thank you for signing up! Click the link below to download your ${magnet.name}:</p>
        <p><a href="${downloadUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Download Now</a></p>
        <p>Best regards,<br>The Expert Breeder Team</p>
      `;

      await sendSendGridEmail(
        email,
        magnet.deliveryEmailSubject || `Your download: ${magnet.name}`,
        emailHtml
      );
    }

    return { success: true, subscriberId };
  } catch (error) {
    console.error('Error sending lead magnet email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 17. Handle Unsubscribe
exports.handleUnsubscribe = functions.https.onRequest(async (req, res) => {
  const { sid, cid, seq } = req.query;

  if (!sid) {
    return res.status(400).send('Invalid unsubscribe link');
  }

  const nowISO = new Date().toISOString();

  try {
    // Update subscriber status
    await db.collection('newsletterSubscribers').doc(sid).update({
      status: 'unsubscribed',
      unsubscribedAt: nowISO,
      unsubscribeSource: cid ? 'campaign' : seq ? 'sequence' : 'direct',
      updatedAt: nowISO,
    });

    // Update campaign stats if applicable
    if (cid) {
      await db.collection('emailCampaigns').doc(cid).update({
        'stats.unsubscribed': admin.firestore.FieldValue.increment(1),
        updatedAt: nowISO,
      });
    }

    // Cancel any active sequences
    if (seq) {
      const progressSnapshot = await db
        .collection('subscriberSequenceProgress')
        .where('subscriberId', '==', sid)
        .where('status', '==', 'active')
        .get();

      const batch = db.batch();
      progressSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'unsubscribed', updatedAt: nowISO });
      });
      await batch.commit();
    }

    // Redirect to unsubscribe confirmation page
    const baseUrl = process.env.APP_URL || 'https://expert-breeder.web.app';
    res.redirect(`${baseUrl}/unsubscribe-confirmed`);
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).send('Error processing your request');
  }
});
