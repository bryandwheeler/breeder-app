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

// ========== PLATFORM EMAIL FUNCTIONS (for breeder-to-breeder notifications) ==========

// Get platform email settings from admin configuration
async function getPlatformEmailSettings() {
  const settingsDoc = await db.collection('adminSettings').doc('platformEmail').get();
  if (!settingsDoc.exists) {
    return null;
  }
  return settingsDoc.data();
}

// Send platform notification email using admin-configured SendGrid
async function sendPlatformNotificationEmail(to, templateType, variables) {
  const settings = await getPlatformEmailSettings();

  if (!settings || !settings.enabled) {
    console.log('Platform email not enabled, skipping notification');
    return { sent: false, reason: 'Platform email not enabled' };
  }

  // Use platform API key if configured, otherwise fall back to env var
  const apiKey = settings.sendGridApiKey || process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.log('SendGrid not configured for platform emails');
    return { sent: false, reason: 'SendGrid not configured' };
  }

  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(apiKey);

  // Get template for this notification type
  const template = settings.templates?.[templateType];
  if (!template) {
    console.log(`No template configured for ${templateType}`);
    return { sent: false, reason: `No template for ${templateType}` };
  }

  // Replace variables in subject and body
  let subject = template.subject || '';
  let body = template.body || '';

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value || '');
    body = body.replace(regex, value || '');
  }

  const msg = {
    to,
    from: {
      email: settings.fromEmail || 'notifications@expertbreeder.com',
      name: settings.fromName || 'Expert Breeder',
    },
    replyTo: settings.replyToEmail || 'support@expertbreeder.com',
    subject,
    html: body,
  };

  try {
    await sgMail.send(msg);
    console.log(`Platform email sent to ${to} for ${templateType}`);
    return { sent: true };
  } catch (error) {
    console.error(`Failed to send platform email to ${to}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

// Check if user wants to receive this notification type via email
async function shouldSendEmailNotification(userId, notificationType) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return true; // Default to sending if user doc doesn't exist
    }

    const prefs = userDoc.data().notificationPreferences;
    if (!prefs) {
      return true; // Default to sending if no preferences set
    }

    // Map notification type to preference key
    const prefKeyMap = {
      'friend_request': 'friendRequestReceived',
      'friend_accepted': 'friendRequestAccepted',
      'new_message': 'newMessage',
      'connection_request': 'connectionRequestReceived',
      'connection_approved': 'connectionRequestApproved',
      'connection_declined': 'connectionRequestDeclined',
    };

    const prefKey = prefKeyMap[notificationType];
    if (!prefKey || !prefs[prefKey]) {
      return true; // Default to sending if preference not found
    }

    return prefs[prefKey].enabled && prefs[prefKey].channels.includes('email');
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true; // Default to sending on error
  }
}

// 18. Send notification on friend request created
exports.onFriendRequestCreated = functions.firestore
  .document('breederFriendships/{friendshipId}')
  .onCreate(async (snap, context) => {
    const friendship = snap.data();
    const friendshipId = context.params.friendshipId;

    // Only send for pending requests
    if (friendship.status !== 'pending') {
      return;
    }

    try {
      // Check if recipient wants email notifications
      const shouldSend = await shouldSendEmailNotification(friendship.recipientId, 'friend_request');
      if (!shouldSend) {
        console.log(`Recipient ${friendship.recipientId} has disabled friend request emails`);
        return;
      }

      // Get recipient's email
      const recipientDoc = await db.collection('users').doc(friendship.recipientId).get();
      if (!recipientDoc.exists) {
        console.log('Recipient user document not found');
        return;
      }

      const recipient = recipientDoc.data();
      if (!recipient.email) {
        console.log('Recipient has no email address');
        return;
      }

      const baseUrl = process.env.APP_URL || 'https://expert-breeder.web.app';

      // Send platform notification email
      await sendPlatformNotificationEmail(
        recipient.email,
        'friend_request',
        {
          recipient_name: recipient.displayName || 'there',
          requester_name: friendship.requesterDisplayName || 'A breeder',
          requester_kennel: friendship.requesterKennelName || '',
          message: friendship.message || '',
          app_url: baseUrl,
          community_url: `${baseUrl}/community`,
        }
      );

      console.log(`Friend request notification sent for ${friendshipId}`);
    } catch (error) {
      console.error('Error sending friend request notification:', error);
    }
  });

// 19. Send notification on friend request accepted
exports.onFriendRequestUpdated = functions.firestore
  .document('breederFriendships/{friendshipId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const friendshipId = context.params.friendshipId;

    // Only send if status changed to accepted
    if (before.status === 'pending' && after.status === 'accepted') {
      try {
        // Check if requester wants email notifications
        const shouldSend = await shouldSendEmailNotification(after.requesterId, 'friend_accepted');
        if (!shouldSend) {
          console.log(`Requester ${after.requesterId} has disabled friend accepted emails`);
          return;
        }

        // Get requester's email
        const requesterDoc = await db.collection('users').doc(after.requesterId).get();
        if (!requesterDoc.exists || !requesterDoc.data().email) {
          return;
        }

        const requester = requesterDoc.data();
        const baseUrl = process.env.APP_URL || 'https://expert-breeder.web.app';

        // Send platform notification email
        await sendPlatformNotificationEmail(
          requester.email,
          'friend_accepted',
          {
            requester_name: requester.displayName || 'there',
            accepter_name: after.recipientDisplayName || 'A breeder',
            accepter_kennel: after.recipientKennelName || '',
            app_url: baseUrl,
            community_url: `${baseUrl}/community`,
          }
        );

        console.log(`Friend accepted notification sent for ${friendshipId}`);
      } catch (error) {
        console.error('Error sending friend accepted notification:', error);
      }
    }
  });

// 20. Callable function to manually send platform notification (for testing/admin)
exports.sendPlatformNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Check if caller is admin
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin');
  }

  const { to, templateType, variables } = data;

  if (!to || !templateType) {
    throw new functions.https.HttpsError('invalid-argument', 'to and templateType are required');
  }

  const result = await sendPlatformNotificationEmail(to, templateType, variables || {});
  return result;
});

// ============================================================================
// Dog Connection Request Functions
// ============================================================================

// Helper: Sync connection status back to the requester's dog
async function syncRequesterDogStatus(requestId, requestData, newStatus) {
  try {
    let dogDocRef = null;

    // Fast path: use requesterDogId if available
    if (requestData.requesterDogId) {
      dogDocRef = db.collection('dogs').doc(requestData.requesterDogId);
      const dogSnap = await dogDocRef.get();
      if (!dogSnap.exists) {
        dogDocRef = null; // fall through to slow path
      }
    }

    // Slow path: query requester's dogs for matching connectionRequestId
    if (!dogDocRef) {
      const dogsSnap = await db.collection('dogs')
        .where('userId', '==', requestData.requesterId)
        .get();

      for (const doc of dogsSnap.docs) {
        const data = doc.data();
        if (
          data.externalSire?.connectionRequestId === requestId ||
          data.externalDam?.connectionRequestId === requestId
        ) {
          dogDocRef = doc.ref;
          break;
        }
      }
    }

    if (!dogDocRef) {
      console.log(`No dog found for connection request ${requestId}`);
      return;
    }

    const dogSnap = await dogDocRef.get();
    const dogData = dogSnap.data();

    // Determine if this is a sire or dam connection
    const isSire = dogData.externalSire?.connectionRequestId === requestId;
    const isDam = dogData.externalDam?.connectionRequestId === requestId;

    if (!isSire && !isDam) {
      // Try matching by requesterDogId path
      if (dogData.externalSire?.ownerId === requestData.ownerId && dogData.externalSire?.dogId === requestData.dogId) {
        const update = { 'externalSire.connectionStatus': newStatus };
        if (newStatus === 'approved' && requestData.linkedDogId) {
          update['externalSire.connectedDogId'] = requestData.linkedDogId;
        }
        await dogDocRef.update(update);
        console.log(`Updated externalSire status to ${newStatus} for dog ${dogDocRef.id}`);
        return;
      }
      if (dogData.externalDam?.ownerId === requestData.ownerId && dogData.externalDam?.dogId === requestData.dogId) {
        const update = { 'externalDam.connectionStatus': newStatus };
        if (newStatus === 'approved' && requestData.linkedDogId) {
          update['externalDam.connectedDogId'] = requestData.linkedDogId;
        }
        await dogDocRef.update(update);
        console.log(`Updated externalDam status to ${newStatus} for dog ${dogDocRef.id}`);
        return;
      }
      console.log(`Could not determine sire/dam for connection request ${requestId}`);
      return;
    }

    const prefix = isSire ? 'externalSire' : 'externalDam';
    const update = { [`${prefix}.connectionStatus`]: newStatus };
    if (newStatus === 'approved' && requestData.linkedDogId) {
      update[`${prefix}.connectedDogId`] = requestData.linkedDogId;
    }

    await dogDocRef.update(update);
    console.log(`Updated ${prefix} status to ${newStatus} for dog ${dogDocRef.id}`);
  } catch (error) {
    console.error('Error syncing requester dog status:', error);
  }
}

// 21. Send notification when a connection request is created
exports.onConnectionRequestCreated = functions.firestore
  .document('connectionRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const request = snap.data();
    const requestId = context.params.requestId;

    try {
      // Create in-app notification for the dog owner
      await db.collection('notifications').add({
        userId: request.ownerId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${request.requesterKennelName || 'A breeder'} wants to connect with your dog "${request.dogName}"`,
        relatedId: requestId,
        relatedType: 'dog_connection',
        actionLabel: 'View Request',
        actionUrl: '/connections',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`In-app notification created for connection request ${requestId}`);

      // Check if owner wants email notifications
      const shouldSend = await shouldSendEmailNotification(request.ownerId, 'connection_request');
      if (!shouldSend) {
        console.log(`Owner ${request.ownerId} has disabled connection request emails`);
        return;
      }

      // Get owner's email
      const ownerDoc = await db.collection('users').doc(request.ownerId).get();
      if (!ownerDoc.exists || !ownerDoc.data().email) {
        console.log('Owner user document not found or has no email');
        return;
      }

      const owner = ownerDoc.data();
      const baseUrl = process.env.APP_URL || 'https://expert-breeder.web.app';

      const purposeLabels = {
        sire: 'Sire (Male used for breeding)',
        dam: 'Dam (Female used for breeding)',
        offspring: 'Offspring (Puppy from a litter)',
        relative: 'Relative (Related dog)',
        reference: 'Reference (For pedigree)',
      };

      await sendPlatformNotificationEmail(
        owner.email,
        'connection_request',
        {
          recipient_name: owner.displayName || 'there',
          requester_name: request.requesterKennelName || 'A breeder',
          dog_name: request.dogName || 'Unknown',
          dog_registration: request.dogRegistrationNumber || 'Not provided',
          purpose: purposeLabels[request.purpose] || request.purpose || 'Not specified',
          message: request.message || '',
          app_url: baseUrl,
          connections_url: `${baseUrl}/connections`,
        }
      );

      console.log(`Connection request email sent for ${requestId}`);
    } catch (error) {
      console.error('Error handling connection request created:', error);
    }
  });

// 22. Handle connection request status changes (approved/declined)
exports.onConnectionRequestUpdated = functions.firestore
  .document('connectionRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const requestId = context.params.requestId;

    // Only process status changes
    if (before.status === after.status) {
      return;
    }

    const baseUrl = process.env.APP_URL || 'https://expert-breeder.web.app';

    try {
      if (after.status === 'approved') {
        // Sync status back to requester's dog
        await syncRequesterDogStatus(requestId, after, 'approved');

        // Create in-app notification for requester
        await db.collection('notifications').add({
          userId: after.requesterId,
          type: 'connection_approved',
          title: 'Connection Request Approved',
          message: `${after.ownerKennelName || 'A breeder'} has approved your request to connect with "${after.dogName}"`,
          relatedId: requestId,
          relatedType: 'dog_connection',
          actionLabel: 'View Connections',
          actionUrl: '/connections',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send email notification to requester
        const shouldSend = await shouldSendEmailNotification(after.requesterId, 'connection_approved');
        if (shouldSend) {
          const requesterDoc = await db.collection('users').doc(after.requesterId).get();
          if (requesterDoc.exists && requesterDoc.data().email) {
            const requester = requesterDoc.data();
            await sendPlatformNotificationEmail(
              requester.email,
              'connection_approved',
              {
                recipient_name: requester.displayName || 'there',
                owner_name: after.ownerKennelName || 'A breeder',
                dog_name: after.dogName || 'Unknown',
                response_message: after.responseMessage || '',
                app_url: baseUrl,
                connections_url: `${baseUrl}/connections`,
              }
            );
          }
        }

        console.log(`Connection approved notification sent for ${requestId}`);
      } else if (after.status === 'declined') {
        // Sync status back to requester's dog
        await syncRequesterDogStatus(requestId, after, 'declined');

        // Create in-app notification for requester
        await db.collection('notifications').add({
          userId: after.requesterId,
          type: 'connection_declined',
          title: 'Connection Request Declined',
          message: `${after.ownerKennelName || 'A breeder'} has declined your request to connect with "${after.dogName}"`,
          relatedId: requestId,
          relatedType: 'dog_connection',
          actionLabel: 'View Connections',
          actionUrl: '/connections',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send email notification to requester
        const shouldSend = await shouldSendEmailNotification(after.requesterId, 'connection_declined');
        if (shouldSend) {
          const requesterDoc = await db.collection('users').doc(after.requesterId).get();
          if (requesterDoc.exists && requesterDoc.data().email) {
            const requester = requesterDoc.data();
            await sendPlatformNotificationEmail(
              requester.email,
              'connection_declined',
              {
                recipient_name: requester.displayName || 'there',
                owner_name: after.ownerKennelName || 'A breeder',
                dog_name: after.dogName || 'Unknown',
                response_message: after.responseMessage || '',
                app_url: baseUrl,
                connections_url: `${baseUrl}/connections`,
              }
            );
          }
        }

        console.log(`Connection declined notification sent for ${requestId}`);
      }
    } catch (error) {
      console.error('Error handling connection request update:', error);
    }
  });

// ============================================================================
// SignNow E-Signature Contract Functions
// ============================================================================

// Lazy-load SignNow client configuration
let signNowConfig = null;
async function getSignNowConfig() {
  if (signNowConfig === null) {
    const configDoc = await db.collection('adminSettings').doc('signNow').get();
    if (!configDoc.exists || !configDoc.data().isConfigured) {
      throw new Error('SignNow is not configured');
    }
    signNowConfig = configDoc.data();
  }
  return signNowConfig;
}

// Get SignNow access token
async function getSignNowAccessToken() {
  const config = await getSignNowConfig();
  const fetch = (await import('node-fetch')).default;

  const response = await fetch(`${config.apiUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${config.basicAuthToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=*',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`SignNow auth error: ${error.error_description || response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// 21. Upload Contract to SignNow
exports.uploadContractToSignNow = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { contractId, pdfBase64, fileName } = data;
  if (!contractId || !pdfBase64) {
    throw new functions.https.HttpsError('invalid-argument', 'contractId and pdfBase64 are required');
  }

  const nowISO = new Date().toISOString();

  try {
    // Verify contract ownership
    const contractRef = db.collection('contracts').doc(contractId);
    const contractDoc = await contractRef.get();
    if (!contractDoc.exists || contractDoc.data().userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to access this contract');
    }

    const config = await getSignNowConfig();
    const accessToken = await getSignNowAccessToken();
    const fetch = (await import('node-fetch')).default;
    const FormData = (await import('form-data')).default;

    // Upload document to SignNow
    const formData = new FormData();
    formData.append('file', Buffer.from(pdfBase64, 'base64'), {
      filename: fileName || 'contract.pdf',
      contentType: 'application/pdf',
    });

    const uploadResponse = await fetch(`${config.apiUrl}/document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => ({}));
      throw new Error(`Upload failed: ${error.message || uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();

    // Update contract with SignNow document ID
    await contractRef.update({
      signNowDocumentId: uploadResult.id,
      status: 'sent',
      updatedAt: nowISO,
    });

    // Record audit event
    await contractRef.collection('auditEvents').add({
      eventType: 'uploaded_to_signnow',
      timestamp: nowISO,
      actorType: 'breeder',
      actorId: context.auth.uid,
      description: 'Document uploaded to SignNow',
      metadata: { signNowDocumentId: uploadResult.id },
    });

    console.log(`Contract ${contractId} uploaded to SignNow: ${uploadResult.id}`);
    return { success: true, documentId: uploadResult.id };
  } catch (error) {
    console.error('Error uploading to SignNow:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 22. Create Signing Invite
exports.createSigningInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { contractId, signers, message, subject } = data;
  if (!contractId || !signers || signers.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'contractId and signers are required');
  }

  const nowISO = new Date().toISOString();

  try {
    // Verify contract ownership
    const contractRef = db.collection('contracts').doc(contractId);
    const contractDoc = await contractRef.get();
    if (!contractDoc.exists || contractDoc.data().userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    }

    const contract = contractDoc.data();
    if (!contract.signNowDocumentId) {
      throw new functions.https.HttpsError('failed-precondition', 'Document not uploaded to SignNow');
    }

    const config = await getSignNowConfig();
    const accessToken = await getSignNowAccessToken();
    const fetch = (await import('node-fetch')).default;

    // Create invite for each signer
    const inviteResults = [];
    for (const signer of signers) {
      const inviteBody = {
        to: [{
          email: signer.email,
          role: signer.role || 'Signer',
          role_id: signer.id,
          order: signer.order || 1,
        }],
        from: contract.mergeData?.breeder_email || context.auth.token.email,
        subject: subject || `Please sign: ${contract.name}`,
        message: message || 'Please review and sign this document.',
      };

      const inviteResponse = await fetch(
        `${config.apiUrl}/document/${contract.signNowDocumentId}/invite`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inviteBody),
        }
      );

      if (!inviteResponse.ok) {
        const error = await inviteResponse.json().catch(() => ({}));
        throw new Error(`Invite failed for ${signer.email}: ${error.message || inviteResponse.statusText}`);
      }

      const inviteResult = await inviteResponse.json();
      inviteResults.push({ ...signer, inviteId: inviteResult.id });

      // Update signer in subcollection
      await contractRef.collection('signers').doc(signer.id).set({
        ...signer,
        inviteId: inviteResult.id,
        status: 'sent',
        updatedAt: nowISO,
      }, { merge: true });
    }

    // Update contract status
    await contractRef.update({
      status: 'sent',
      sentAt: nowISO,
      updatedAt: nowISO,
    });

    // Record audit event
    await contractRef.collection('auditEvents').add({
      eventType: 'invite_sent',
      timestamp: nowISO,
      actorType: 'breeder',
      actorId: context.auth.uid,
      description: `Invites sent to ${signers.length} signer(s)`,
      metadata: { signerEmails: signers.map(s => s.email) },
    });

    console.log(`Invites sent for contract ${contractId}`);
    return { success: true, invites: inviteResults };
  } catch (error) {
    console.error('Error creating signing invite:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 23. Get Embedded Signing Link
exports.getEmbeddedSigningLink = functions.https.onCall(async (data, context) => {
  const { contractId, signerId, redirectUrl } = data;
  if (!contractId || !signerId) {
    throw new functions.https.HttpsError('invalid-argument', 'contractId and signerId are required');
  }

  const nowISO = new Date().toISOString();

  try {
    const contractRef = db.collection('contracts').doc(contractId);
    const contractDoc = await contractRef.get();
    if (!contractDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Contract not found');
    }

    const contract = contractDoc.data();

    // Get signer
    const signerRef = contractRef.collection('signers').doc(signerId);
    const signerDoc = await signerRef.get();
    if (!signerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Signer not found');
    }

    const signer = signerDoc.data();

    const config = await getSignNowConfig();
    const accessToken = await getSignNowAccessToken();
    const fetch = (await import('node-fetch')).default;

    // Generate embedded signing link
    const linkResponse = await fetch(`${config.apiUrl}/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: contract.signNowDocumentId,
        invite_id: signer.inviteId,
        auth_method: 'none',
        redirect_uri: redirectUrl || `${process.env.APP_URL || 'https://expert-breeder.web.app'}/contracts/${contractId}/signed`,
      }),
    });

    if (!linkResponse.ok) {
      const error = await linkResponse.json().catch(() => ({}));
      throw new Error(`Failed to get signing link: ${error.message || linkResponse.statusText}`);
    }

    const linkResult = await linkResponse.json();

    // Update signer with embedded URL (expires in 30 minutes)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await signerRef.update({
      embeddedSigningUrl: linkResult.url,
      embeddedUrlExpiresAt: expiresAt,
      signingMethod: 'embedded',
      updatedAt: nowISO,
    });

    console.log(`Embedded signing link generated for contract ${contractId}, signer ${signerId}`);
    return {
      success: true,
      signingUrl: linkResult.url,
      expiresAt,
    };
  } catch (error) {
    console.error('Error getting embedded signing link:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 24. SignNow Webhook Handler
exports.handleSignNowWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const nowISO = new Date().toISOString();

  try {
    const event = req.body;
    const eventType = event.event || event.type;
    const documentId = event.document_id || event.data?.document_id;

    console.log(`SignNow webhook received: ${eventType} for document ${documentId}`);

    // Log webhook event for debugging
    const eventRef = await db.collection('signNowWebhookEvents').add({
      eventType,
      documentId,
      timestamp: nowISO,
      rawPayload: event,
      processed: false,
    });

    if (!documentId) {
      console.log('No document ID in webhook payload');
      await eventRef.update({ processed: true, error: 'No document ID' });
      return res.json({ received: true });
    }

    // Find contract by SignNow document ID
    const contractsQuery = await db.collection('contracts')
      .where('signNowDocumentId', '==', documentId)
      .limit(1)
      .get();

    if (contractsQuery.empty) {
      console.log(`No contract found for SignNow document ${documentId}`);
      await eventRef.update({ processed: true, error: 'Contract not found' });
      return res.json({ received: true });
    }

    const contractDoc = contractsQuery.docs[0];
    const contractRef = contractDoc.ref;

    // Process event based on type
    switch (eventType) {
      case 'document.viewed':
      case 'document_viewed': {
        const viewerEmail = event.data?.viewer_email || event.signer_email;
        if (viewerEmail) {
          // Find and update signer
          const signersQuery = await contractRef.collection('signers')
            .where('email', '==', viewerEmail)
            .limit(1)
            .get();

          if (!signersQuery.empty) {
            await signersQuery.docs[0].ref.update({
              status: 'viewed',
              viewedAt: nowISO,
              updatedAt: nowISO,
            });
          }

          await contractRef.update({
            status: 'viewed',
            updatedAt: nowISO,
          });

          await contractRef.collection('auditEvents').add({
            eventType: 'viewed',
            timestamp: nowISO,
            actorType: 'signer',
            actorEmail: viewerEmail,
            description: `Document viewed by ${viewerEmail}`,
          });
        }
        break;
      }

      case 'document.signed':
      case 'document_signed': {
        const signerEmail = event.data?.signer_email || event.signer_email;
        if (signerEmail) {
          // Update signer status
          const signersQuery = await contractRef.collection('signers')
            .where('email', '==', signerEmail)
            .limit(1)
            .get();

          if (!signersQuery.empty) {
            await signersQuery.docs[0].ref.update({
              status: 'signed',
              signedAt: nowISO,
              signedFromIp: event.data?.ip_address || event.ip_address,
              updatedAt: nowISO,
            });
          }

          await contractRef.collection('auditEvents').add({
            eventType: 'signed',
            timestamp: nowISO,
            actorType: 'signer',
            actorEmail: signerEmail,
            description: `Document signed by ${signerEmail}`,
            ipAddress: event.data?.ip_address || event.ip_address,
          });

          // Check if all signers have signed
          const allSigners = await contractRef.collection('signers').get();
          const allSigned = allSigners.docs.every(d => d.data().status === 'signed');

          if (allSigned) {
            await contractRef.update({
              status: 'signed',
              completedAt: nowISO,
              updatedAt: nowISO,
            });

            await contractRef.collection('auditEvents').add({
              eventType: 'completed',
              timestamp: nowISO,
              actorType: 'system',
              description: 'All parties have signed the document',
            });

            // Queue signed PDF download
            await db.collection('signNowDownloadQueue').add({
              contractId: contractDoc.id,
              documentId,
              status: 'pending',
              createdAt: nowISO,
              retryCount: 0,
            });

            console.log(`Contract ${contractDoc.id} completed, queued for PDF download`);
          } else {
            await contractRef.update({
              status: 'partially_signed',
              updatedAt: nowISO,
            });
          }
        }
        break;
      }

      case 'document.declined':
      case 'document_declined': {
        const declinerEmail = event.data?.signer_email || event.signer_email;
        const declineReason = event.data?.decline_reason || event.decline_reason;

        if (declinerEmail) {
          const signersQuery = await contractRef.collection('signers')
            .where('email', '==', declinerEmail)
            .limit(1)
            .get();

          if (!signersQuery.empty) {
            await signersQuery.docs[0].ref.update({
              status: 'declined',
              declinedAt: nowISO,
              declineReason,
              updatedAt: nowISO,
            });
          }

          await contractRef.update({
            status: 'declined',
            updatedAt: nowISO,
          });

          await contractRef.collection('auditEvents').add({
            eventType: 'declined',
            timestamp: nowISO,
            actorType: 'signer',
            actorEmail: declinerEmail,
            description: `Document declined by ${declinerEmail}`,
            metadata: { reason: declineReason },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled SignNow event type: ${eventType}`);
    }

    await eventRef.update({ processed: true, processedAt: nowISO });
    res.json({ received: true });

  } catch (error) {
    console.error('Error handling SignNow webhook:', error);
    res.status(500).send('Internal error');
  }
});

// 25. Process Signed PDF Download Queue
exports.processSignedPdfDownloads = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const nowISO = new Date().toISOString();

    try {
      const pendingDownloads = await db.collection('signNowDownloadQueue')
        .where('status', '==', 'pending')
        .limit(10)
        .get();

      if (pendingDownloads.empty) {
        return null;
      }

      console.log(`Processing ${pendingDownloads.size} signed PDF downloads`);

      const config = await getSignNowConfig();
      const accessToken = await getSignNowAccessToken();
      const fetch = (await import('node-fetch')).default;

      for (const downloadDoc of pendingDownloads.docs) {
        const { contractId, documentId, retryCount } = downloadDoc.data();

        try {
          await downloadDoc.ref.update({ status: 'processing' });

          // Download signed PDF from SignNow
          const pdfResponse = await fetch(
            `${config.apiUrl}/document/${documentId}/download?type=collapsed`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` },
            }
          );

          if (!pdfResponse.ok) {
            throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
          }

          const pdfBuffer = await pdfResponse.buffer();

          // Upload to Firebase Storage
          const storage = admin.storage();
          const bucket = storage.bucket();
          const filePath = `contracts/${contractId}/signed_${Date.now()}.pdf`;
          const file = bucket.file(filePath);

          await file.save(pdfBuffer, {
            metadata: { contentType: 'application/pdf' },
          });

          // Get download URL
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2030', // Long expiration
          });

          // Update contract with signed PDF URL
          const contractRef = db.collection('contracts').doc(contractId);
          await contractRef.update({
            signedPdfUrl: signedUrl,
            updatedAt: nowISO,
          });

          await contractRef.collection('auditEvents').add({
            eventType: 'downloaded',
            timestamp: nowISO,
            actorType: 'system',
            description: 'Signed PDF downloaded and stored',
          });

          await downloadDoc.ref.update({
            status: 'completed',
            completedAt: nowISO,
          });

          console.log(`Signed PDF downloaded for contract ${contractId}`);

        } catch (error) {
          console.error(`Error downloading PDF for ${contractId}:`, error);

          // Retry up to 3 times
          if (retryCount < 3) {
            await downloadDoc.ref.update({
              status: 'pending',
              retryCount: retryCount + 1,
              lastError: error.message,
            });
          } else {
            await downloadDoc.ref.update({
              status: 'failed',
              error: error.message,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in processSignedPdfDownloads:', error);
    }

    return null;
  });

// ========== CUSTOM DOMAIN VERIFICATION ==========

// DNS lookup using built-in dns module
const dns = require('dns').promises;

/**
 * Verify custom domain CNAME configuration
 * Called from the web app when user clicks "Verify DNS"
 */
exports.verifyCustomDomain = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { domain } = data;
  if (!domain) {
    throw new functions.https.HttpsError('invalid-argument', 'Domain is required');
  }

  const userId = context.auth.uid;
  const nowISO = new Date().toISOString();
  const expectedCname = 'websites.expertbreeder.com';

  try {
    // Get user's website settings to verify they own this domain
    const settingsRef = db.collection('websiteSettings').doc(userId);
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Website settings not found');
    }

    const settings = settingsDoc.data();
    if (settings.domain?.customDomain !== domain) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Domain does not match your configuration'
      );
    }

    // Check user subscription tier (must be 'pro')
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const subscriptionTier = userDoc.data()?.subscriptionTier || 'free';

    if (subscriptionTier !== 'pro') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Custom domains require a Pro subscription'
      );
    }

    // Update status to verifying
    await settingsRef.update({
      'domain.customDomainStatus': 'verifying',
      'domain.verificationError': admin.firestore.FieldValue.delete(),
      updatedAt: nowISO,
    });

    // Perform DNS lookup
    let cnameRecords = [];
    try {
      cnameRecords = await dns.resolveCname(domain);
    } catch (dnsError) {
      // CNAME not found - check if there's an A record pointing somewhere
      // This is a common misconfiguration
      let errorMessage = 'No CNAME record found for this domain.';

      try {
        const aRecords = await dns.resolve4(domain);
        if (aRecords.length > 0) {
          errorMessage = 'Found A record instead of CNAME. Please add a CNAME record pointing to ' + expectedCname;
        }
      } catch {
        // No A record either
        errorMessage = 'No DNS records found. Please add a CNAME record pointing to ' + expectedCname;
      }

      await settingsRef.update({
        'domain.customDomainStatus': 'failed',
        'domain.verificationError': errorMessage,
        updatedAt: nowISO,
      });

      return {
        success: false,
        status: 'failed',
        error: errorMessage,
      };
    }

    // Check if CNAME points to our target
    const cnameTarget = cnameRecords[0]?.toLowerCase();
    if (cnameTarget === expectedCname || cnameTarget === expectedCname + '.') {
      // DNS verified - update status
      await settingsRef.update({
        'domain.customDomainStatus': 'verified',
        'domain.customDomainVerifiedAt': nowISO,
        'domain.verificationError': admin.firestore.FieldValue.delete(),
        updatedAt: nowISO,
      });

      // In production, this would trigger SSL provisioning
      // For now, we'll set it to active after a short delay
      // In a real implementation, you'd use a webhook from your SSL provider

      // Simulate SSL provisioning (set to active)
      setTimeout(async () => {
        try {
          await settingsRef.update({
            'domain.customDomainStatus': 'active',
            'domain.sslStatus': 'active',
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.error('Error updating to active status:', e);
        }
      }, 5000);

      return {
        success: true,
        status: 'verified',
        message: 'DNS verified successfully. SSL certificate is being provisioned.',
      };
    } else {
      // CNAME exists but points to wrong target
      const errorMessage = `CNAME points to ${cnameTarget} instead of ${expectedCname}. Please update your DNS settings.`;

      await settingsRef.update({
        'domain.customDomainStatus': 'failed',
        'domain.verificationError': errorMessage,
        updatedAt: nowISO,
      });

      return {
        success: false,
        status: 'failed',
        error: errorMessage,
      };
    }
  } catch (error) {
    console.error('Error verifying domain:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to verify domain: ' + error.message);
  }
});

/**
 * Scheduled function to check domain status periodically
 * Re-verifies pending/failed domains and checks for DNS changes
 */
exports.checkDomainStatus = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (_context) => {
    const nowISO = new Date().toISOString();
    const expectedCname = 'websites.expertbreeder.com';

    try {
      // Get all domains that need verification
      const pendingDomains = await db
        .collection('websiteSettings')
        .where('domain.customDomainStatus', 'in', ['pending', 'failed', 'verifying'])
        .get();

      console.log(`Checking ${pendingDomains.size} domains for DNS status`);

      for (const doc of pendingDomains.docs) {
        const settings = doc.data();
        const domain = settings.domain?.customDomain;

        if (!domain) continue;

        try {
          const cnameRecords = await dns.resolveCname(domain);
          const cnameTarget = cnameRecords[0]?.toLowerCase();

          if (cnameTarget === expectedCname || cnameTarget === expectedCname + '.') {
            // Domain is now verified
            await doc.ref.update({
              'domain.customDomainStatus': 'active',
              'domain.customDomainVerifiedAt': nowISO,
              'domain.sslStatus': 'active',
              'domain.verificationError': admin.firestore.FieldValue.delete(),
              updatedAt: nowISO,
            });
            console.log(`Domain ${domain} verified and activated`);
          }
        } catch (dnsError) {
          // Still no valid CNAME
          console.log(`Domain ${domain} still not configured correctly`);
        }
      }

      // Also check active domains to make sure DNS hasn't changed
      const activeDomains = await db
        .collection('websiteSettings')
        .where('domain.customDomainStatus', '==', 'active')
        .get();

      for (const doc of activeDomains.docs) {
        const settings = doc.data();
        const domain = settings.domain?.customDomain;

        if (!domain) continue;

        try {
          const cnameRecords = await dns.resolveCname(domain);
          const cnameTarget = cnameRecords[0]?.toLowerCase();

          if (cnameTarget !== expectedCname && cnameTarget !== expectedCname + '.') {
            // DNS changed - mark as failed
            await doc.ref.update({
              'domain.customDomainStatus': 'failed',
              'domain.verificationError': 'DNS configuration changed. Please re-verify your domain.',
              updatedAt: nowISO,
            });
            console.log(`Domain ${domain} DNS changed, marked as failed`);
          }
        } catch (dnsError) {
          // CNAME no longer exists
          await doc.ref.update({
            'domain.customDomainStatus': 'failed',
            'domain.verificationError': 'CNAME record no longer found. Please re-verify your domain.',
            updatedAt: nowISO,
          });
          console.log(`Domain ${domain} CNAME removed, marked as failed`);
        }
      }
    } catch (error) {
      console.error('Error in checkDomainStatus:', error);
    }

    return null;
  });

// ========== FIREBASE HOSTING CUSTOM DOMAIN AUTOMATION ==========

// Firebase project and site configuration
const FIREBASE_PROJECT_ID = 'expert-breeder';
const FIREBASE_SITE_ID = 'expert-breeder'; // Usually same as project ID

// Lazy-load GoogleAuth to avoid deployment timeout
let googleAuthClient = null;

/**
 * Get an authenticated access token for Firebase Hosting API
 */
async function getHostingAccessToken() {
  if (!googleAuthClient) {
    const { GoogleAuth } = require('google-auth-library');
    googleAuthClient = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/firebase.hosting'],
    });
  }
  const client = await googleAuthClient.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

/**
 * Add a custom domain to Firebase Hosting
 * This initiates the domain verification and SSL provisioning process
 */
exports.addCustomDomainToHosting = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { domain } = data;
  if (!domain) {
    throw new functions.https.HttpsError('invalid-argument', 'Domain is required');
  }

  const userId = context.auth.uid;
  const nowISO = new Date().toISOString();

  try {
    // Verify user owns this domain configuration
    const settingsRef = db.collection('websiteSettings').doc(userId);
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Website settings not found');
    }

    // Check subscription tier (must be 'pro')
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const subscriptionTier = userDoc.data()?.subscriptionTier || 'free';

    if (subscriptionTier !== 'pro') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Custom domains require a Pro subscription'
      );
    }

    // Normalize domain (remove protocol if present)
    const normalizedDomain = domain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    // Update Firestore with pending status
    await settingsRef.update({
      'domain.customDomain': normalizedDomain,
      'domain.customDomainStatus': 'pending',
      'domain.verificationError': admin.firestore.FieldValue.delete(),
      updatedAt: nowISO,
    });

    // Get access token for Firebase Hosting API
    const accessToken = await getHostingAccessToken();
    const fetch = (await import('node-fetch')).default;

    console.log(`[addCustomDomainToHosting] Adding domain: ${normalizedDomain}`);

    // Use the correct API endpoint: customDomains (not just domains)
    // See: https://firebasehosting.googleapis.com/$discovery/rest?version=v1beta1
    const customDomainsUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${FIREBASE_PROJECT_ID}/sites/${FIREBASE_SITE_ID}/customDomains`;

    // First check if domain already exists
    const getDomainUrl = `${customDomainsUrl}/${encodeURIComponent(normalizedDomain)}`;
    console.log(`[addCustomDomainToHosting] Checking if domain exists: ${getDomainUrl}`);

    let domainData;
    let status = 'pending';
    let sslStatus = 'pending';

    const checkResponse = await fetch(getDomainUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (checkResponse.ok) {
      // Domain already exists
      domainData = await checkResponse.json();
      console.log(`[addCustomDomainToHosting] Domain exists:`, JSON.stringify(domainData, null, 2));
    } else {
      // Domain doesn't exist, create it using POST with customDomainId query parameter
      console.log(`[addCustomDomainToHosting] Domain not found, creating...`);

      const createUrl = `${customDomainsUrl}?customDomainId=${encodeURIComponent(normalizedDomain)}`;
      console.log(`[addCustomDomainToHosting] Creating domain at: ${createUrl}`);

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const createData = await createResponse.json();
      console.log(`[addCustomDomainToHosting] Create response:`, JSON.stringify(createData, null, 2));

      if (!createResponse.ok) {
        console.error('Firebase Hosting API error:', createData);
        await settingsRef.update({
          'domain.customDomainStatus': 'failed',
          'domain.verificationError': createData.error?.message || 'Failed to add domain to hosting',
          updatedAt: nowISO,
        });
        throw new functions.https.HttpsError(
          'internal',
          createData.error?.message || 'Failed to add domain to Firebase Hosting'
        );
      }

      domainData = createData;
    }

    // Parse domain status
    // CustomDomain status fields: ownershipState, certState, hostState
    const ownershipState = domainData.ownershipState || domainData.ownership?.status;
    const certState = domainData.certState || domainData.cert?.state;
    const hostState = domainData.hostState;

    console.log(`[addCustomDomainToHosting] States - ownership: ${ownershipState}, cert: ${certState}, host: ${hostState}`);

    // Determine overall status
    if (ownershipState === 'OWNERSHIP_ACTIVE' && certState === 'CERT_ACTIVE') {
      status = 'active';
      sslStatus = 'active';
    } else if (ownershipState === 'OWNERSHIP_ACTIVE') {
      status = 'verified';
      sslStatus = certState === 'CERT_ACTIVE' ? 'active' : 'provisioning';
    } else if (ownershipState === 'OWNERSHIP_PENDING') {
      status = 'pending_verification';
    } else {
      status = 'pending';
    }

    // Parse required DNS records from requiredDnsUpdates
    // Firebase API returns DnsRecordSet objects: { domainName, records: [{ type, rdata, requiredAction }] }
    const requiredDnsUpdates = domainData.requiredDnsUpdates || {};
    const desiredRecordSets = requiredDnsUpdates.desired || [];
    console.log('[addCustomDomainToHosting] requiredDnsUpdates.desired:', JSON.stringify(desiredRecordSets, null, 2));

    const aRecords = [];
    const txtRecords = [];
    let acmeChallengeToken = null;

    for (const recordSet of desiredRecordSets) {
      const domainName = recordSet.domainName || '';
      const records = recordSet.records || [];

      // Also handle flat format (type/rrdatas) in case API returns that
      if (recordSet.type && !records.length) {
        if (recordSet.type === 'A') {
          aRecords.push(...(recordSet.rrdatas || []));
        } else if (recordSet.type === 'TXT') {
          if (domainName.includes('_acme-challenge')) {
            acmeChallengeToken = recordSet.rrdatas?.[0] || null;
          } else {
            txtRecords.push(...(recordSet.rrdatas || []));
          }
        }
        continue;
      }

      // Handle DnsRecordSet format: { domainName, records: [{ type, rdata, requiredAction }] }
      for (const record of records) {
        if (record.type === 'A') {
          if (record.rdata) aRecords.push(record.rdata);
        } else if (record.type === 'TXT') {
          if (domainName.includes('_acme-challenge')) {
            acmeChallengeToken = record.rdata;
            console.log('[addCustomDomainToHosting] Found ACME challenge token:', acmeChallengeToken);
          } else {
            if (record.rdata) txtRecords.push(record.rdata);
          }
        }
      }
    }

    // Also check domainData.cert.verification and domainData.verification paths for ACME
    if (!acmeChallengeToken) {
      const certVerification = domainData.cert?.verification?.dns?.desired || domainData.verification?.dns?.desired || [];
      for (const entry of certVerification) {
        if (entry.domainName?.includes('_acme-challenge')) {
          const acmeRecord = (entry.records || []).find(r => r.type === 'TXT');
          if (acmeRecord?.rdata) {
            acmeChallengeToken = acmeRecord.rdata;
            console.log('[addCustomDomainToHosting] Found ACME token in cert.verification:', acmeChallengeToken);
          }
        }
      }
    }

    // Use default Firebase Hosting IPs if none specified
    const firebaseARecords = aRecords.length > 0 ? aRecords : ['199.36.158.100'];
    console.log('[addCustomDomainToHosting] Parsed - A records:', firebaseARecords, 'TXT records:', txtRecords, 'ACME token:', acmeChallengeToken);

    // Update Firestore with the status and configuration info
    const updateData = {
      'domain.customDomain': normalizedDomain,
      'domain.customDomainStatus': status,
      'domain.sslStatus': sslStatus,
      'domain.aRecords': firebaseARecords,
      'domain.cnameTarget': 'expert-breeder.web.app',
      updatedAt: nowISO,
    };

    // Add TXT records if available (for ownership verification)
    if (txtRecords.length > 0) {
      updateData['domain.verificationToken'] = txtRecords[0];
    }

    // Add ACME challenge token if available (for SSL verification)
    if (acmeChallengeToken) {
      updateData['domain.acmeChallengeToken'] = acmeChallengeToken;
    }

    // Clear any previous error
    updateData['domain.verificationError'] = admin.firestore.FieldValue.delete();

    await settingsRef.update(updateData);

    return {
      success: true,
      domain: normalizedDomain,
      status,
      sslStatus,
      aRecords: firebaseARecords,
      txtRecords,
      acmeChallengeToken,
      cnameTarget: 'expert-breeder.web.app',
      message: status === 'active'
        ? 'Domain is active and SSL is configured'
        : status === 'verified'
        ? 'Domain is verified, SSL is being provisioned'
        : status === 'pending_verification'
        ? 'Please add the required DNS records to verify domain ownership'
        : 'Domain is being configured',
    };
  } catch (error) {
    console.error('Error adding custom domain:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to add custom domain: ' + error.message);
  }
});

/**
 * Check custom domain status from Firebase Hosting API
 * Returns current verification and SSL status
 */
exports.getCustomDomainStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { domain } = data;
  if (!domain) {
    throw new functions.https.HttpsError('invalid-argument', 'Domain is required');
  }

  const userId = context.auth.uid;
  const nowISO = new Date().toISOString();

  try {
    // Verify user owns this domain
    const settingsRef = db.collection('websiteSettings').doc(userId);
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Website settings not found');
    }

    const settings = settingsDoc.data();
    if (settings.domain?.customDomain !== domain) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Domain does not match your configuration'
      );
    }

    // Get access token and fetch status from Firebase Hosting
    const accessToken = await getHostingAccessToken();
    const fetch = (await import('node-fetch')).default;

    // Normalize domain (remove trailing dot if present)
    const normalizedDomain = domain.replace(/\.$/, '');

    // Use the customDomains endpoint (not domains)
    const customDomainsUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${FIREBASE_PROJECT_ID}/sites/${FIREBASE_SITE_ID}/customDomains/${encodeURIComponent(normalizedDomain)}`;

    console.log('Fetching domain status from:', customDomainsUrl);

    const response = await fetch(customDomainsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          status: 'not_found',
          message: 'Domain not found in Firebase Hosting. Please add it first.',
        };
      }
      const errorText = await response.text();
      console.error('Failed to get domain status:', response.status, errorText);
      throw new Error(`Failed to get domain status: ${response.status}`);
    }

    const domainData = await response.json();
    console.log('Domain status response:', JSON.stringify(domainData, null, 2));

    // Extract status information from CustomDomain response
    let status = 'pending';
    let sslStatus = 'pending';
    let verificationToken = null;
    let acmeChallengeToken = null;
    const aRecords = [];

    // Parse ownership and cert states from CustomDomain response
    // certState can be at top level (certState) or nested (cert.state)
    const ownershipState = domainData.ownershipState;
    const certState = domainData.certState || domainData.cert?.state;
    const hostState = domainData.hostState;

    console.log('Parsed states:', { ownershipState, certState, hostState });

    // Parse required DNS updates for verification token, A records, and ACME token
    // Firebase API returns DnsRecordSet objects: { domainName, records: [{ type, rdata, requiredAction }] }
    const requiredDnsUpdates = domainData.requiredDnsUpdates || {};
    const desiredRecordSets = requiredDnsUpdates.desired || [];
    console.log('requiredDnsUpdates.desired:', JSON.stringify(desiredRecordSets, null, 2));

    for (const recordSet of desiredRecordSets) {
      const domainName = recordSet.domainName || '';
      const records = recordSet.records || [];

      // Handle flat format (type/rrdatas) in case API returns that
      if (recordSet.type && !records.length) {
        if (recordSet.type === 'A') {
          aRecords.push(...(recordSet.rrdatas || []));
        } else if (recordSet.type === 'TXT') {
          if (domainName.includes('_acme-challenge')) {
            acmeChallengeToken = recordSet.rrdatas?.[0] || null;
          } else if (!verificationToken) {
            verificationToken = recordSet.rrdatas?.[0] || null;
          }
        }
        continue;
      }

      // Handle DnsRecordSet format: { domainName, records: [{ type, rdata, requiredAction }] }
      for (const record of records) {
        if (record.type === 'A') {
          if (record.rdata) aRecords.push(record.rdata);
        } else if (record.type === 'TXT') {
          if (domainName.includes('_acme-challenge')) {
            acmeChallengeToken = record.rdata;
            console.log('Found ACME challenge token:', acmeChallengeToken);
          } else if (!verificationToken) {
            verificationToken = record.rdata;
          }
        }
      }
    }

    // Also check cert.verification and verification paths for ACME
    if (!acmeChallengeToken) {
      const certVerification = domainData.cert?.verification?.dns?.desired || domainData.verification?.dns?.desired || [];
      for (const entry of certVerification) {
        if (entry.domainName?.includes('_acme-challenge')) {
          const acmeRecord = (entry.records || []).find(r => r.type === 'TXT');
          if (acmeRecord?.rdata) {
            acmeChallengeToken = acmeRecord.rdata;
            console.log('Found ACME token in cert.verification:', acmeChallengeToken);
          }
        }
      }
    }

    // If no A records found, use Firebase's default
    if (aRecords.length === 0) {
      aRecords.push('199.36.158.100');
    }

    console.log('Parsed - A records:', aRecords, 'verificationToken:', verificationToken, 'ACME token:', acmeChallengeToken);

    // Determine status based on CustomDomain states
    if (ownershipState === 'OWNERSHIP_ACTIVE' && certState === 'CERT_ACTIVE') {
      status = 'active';
      sslStatus = 'active';
    } else if (ownershipState === 'OWNERSHIP_ACTIVE' && certState === 'CERT_PROPAGATING') {
      status = 'verified';
      sslStatus = 'provisioning';
    } else if (ownershipState === 'OWNERSHIP_ACTIVE') {
      status = 'verified';
      sslStatus = certState === 'CERT_ACTIVE' ? 'active' : 'provisioning';
    } else if (ownershipState === 'OWNERSHIP_PENDING') {
      status = 'pending_verification';
    } else if (ownershipState === 'OWNERSHIP_MISSING') {
      status = 'pending_verification';
    }

    // Build update data, only including defined values
    const updateData = {
      'domain.customDomainStatus': status,
      'domain.sslStatus': sslStatus,
      updatedAt: nowISO,
    };

    // Only set firebaseHostingStatus if we have meaningful state info
    if (ownershipState || certState) {
      updateData['domain.firebaseHostingStatus'] = `ownership:${ownershipState || 'unknown'},cert:${certState || 'unknown'}`;
    }

    if (verificationToken) {
      updateData['domain.verificationToken'] = verificationToken;
    }

    if (acmeChallengeToken) {
      updateData['domain.acmeChallengeToken'] = acmeChallengeToken;
    }

    if (aRecords.length > 0) {
      updateData['domain.aRecords'] = aRecords;
    }

    if (status === 'active') {
      updateData['domain.customDomainVerifiedAt'] = nowISO;
      updateData['domain.verificationError'] = admin.firestore.FieldValue.delete();
      // Clear verification tokens when active
      updateData['domain.acmeChallengeToken'] = admin.firestore.FieldValue.delete();
    }

    await settingsRef.update(updateData);

    return {
      success: true,
      domain: normalizedDomain,
      status,
      sslStatus,
      verificationToken,
      acmeChallengeToken,
      aRecords,
      ownershipState,
      certState,
      message: status === 'active'
        ? 'Domain is active with SSL'
        : status === 'verified'
        ? 'Domain verified, SSL is being provisioned'
        : 'Waiting for domain verification',
    };
  } catch (error) {
    console.error('Error getting domain status:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to get domain status: ' + error.message);
  }
});

/**
 * Remove a custom domain from Firebase Hosting
 */
exports.removeCustomDomainFromHosting = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { domain } = data;
  if (!domain) {
    throw new functions.https.HttpsError('invalid-argument', 'Domain is required');
  }

  const userId = context.auth.uid;
  const nowISO = new Date().toISOString();

  try {
    // Verify user owns this domain
    const settingsRef = db.collection('websiteSettings').doc(userId);
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Website settings not found');
    }

    const settings = settingsDoc.data();
    if (settings.domain?.customDomain !== domain) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Domain does not match your configuration'
      );
    }

    // Get access token and delete from Firebase Hosting
    const accessToken = await getHostingAccessToken();
    const fetch = (await import('node-fetch')).default;

    const hostingApiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${FIREBASE_PROJECT_ID}/sites/${FIREBASE_SITE_ID}/customDomains/${encodeURIComponent(domain)}`;

    const response = await fetch(hostingApiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to remove domain');
    }

    // Clear domain settings in Firestore
    await settingsRef.update({
      'domain.customDomain': admin.firestore.FieldValue.delete(),
      'domain.customDomainStatus': admin.firestore.FieldValue.delete(),
      'domain.customDomainVerifiedAt': admin.firestore.FieldValue.delete(),
      'domain.sslStatus': admin.firestore.FieldValue.delete(),
      'domain.verificationToken': admin.firestore.FieldValue.delete(),
      'domain.aRecords': admin.firestore.FieldValue.delete(),
      'domain.firebaseHostingStatus': admin.firestore.FieldValue.delete(),
      'domain.verificationError': admin.firestore.FieldValue.delete(),
      updatedAt: nowISO,
    });

    return {
      success: true,
      message: 'Custom domain removed successfully',
    };
  } catch (error) {
    console.error('Error removing custom domain:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to remove domain: ' + error.message);
  }
});

// ============================================================================
// Appointment Booking Notifications
// ============================================================================

// Send notification when a new booking is created
exports.onBookingCreated = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    const bookingId = context.params.bookingId;

    try {
      // Get breeder user doc
      const breederDoc = await db.collection('users').doc(booking.breederId).get();
      if (!breederDoc.exists) {
        console.log('Breeder user not found for booking notification');
        return;
      }

      const breeder = breederDoc.data();
      if (!breeder.email) {
        console.log('Breeder has no email');
        return;
      }

      // Get breeder profile for kennel name
      const profileQuery = await db.collection('breederProfiles')
        .where('userId', '==', booking.breederId)
        .limit(1)
        .get();
      const breederProfile = profileQuery.docs[0]?.data();
      const breederName = breederProfile?.kennelName || breederProfile?.breederName || breeder.displayName || 'Breeder';

      // Format date/time for display
      const startTime = new Date(booking.startTime);
      const dateStr = startTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeStr = startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const baseUrl = process.env.APP_URL || 'https://expert-breeder.web.app';

      // Send notification email to breeder
      await sendPlatformNotificationEmail(
        breeder.email,
        'new_booking',
        {
          breeder_name: breederName,
          customer_name: booking.customerName || 'A customer',
          customer_email: booking.customerEmail || '',
          customer_phone: booking.customerPhone || '',
          appointment_type: booking.appointmentTypeName || 'Appointment',
          appointment_date: dateStr,
          appointment_time: timeStr,
          duration: `${booking.duration || 30} minutes`,
          notes: booking.notes || 'None',
          app_url: baseUrl,
        }
      );

      // Create in-app notification for breeder
      await db.collection('notifications').add({
        userId: booking.breederId,
        type: 'new_booking',
        title: 'New Appointment Booking',
        message: `${booking.customerName} booked a ${booking.appointmentTypeName} on ${dateStr} at ${timeStr}`,
        read: false,
        data: {
          bookingId: bookingId,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          appointmentType: booking.appointmentTypeName,
          startTime: booking.startTime,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Booking notification sent for ${bookingId}`);

      // Sync to Google Calendar if enabled
      try {
        await syncBookingToGoogleCalendar(booking, bookingId);
      } catch (calError) {
        console.error('Google Calendar sync failed (non-blocking):', calError);
      }
    } catch (error) {
      console.error('Error sending booking notification:', error);
    }
  });

// ============================================================================
// Google Calendar Integration
// ============================================================================

// Helper: Get a valid Google access token (refresh if expired)
async function getValidGoogleAccessToken(breederId) {
  const tokenDoc = await db.collection('googleCalendarTokens').doc(breederId).get();
  if (!tokenDoc.exists) return null;

  const tokenData = tokenDoc.data();
  const now = Date.now();

  // If token is still valid (with 5 min buffer), return it
  if (tokenData.expiresAt && tokenData.expiresAt > now + 5 * 60 * 1000) {
    return tokenData.accessToken;
  }

  // Refresh the token
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || !tokenData.refreshToken) {
    console.log('Missing Google OAuth credentials or refresh token');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Token refresh failed:', error);
      // If refresh token is revoked/invalid, mark as disconnected
      if (error.error === 'invalid_grant') {
        await db.collection('googleCalendarTokens').doc(breederId).delete();
        await db.collection('schedulingSettings').doc(breederId).update({
          googleCalendarEnabled: false,
          googleCalendarId: '',
        });
      }
      return null;
    }

    const tokens = await response.json();
    await db.collection('googleCalendarTokens').doc(breederId).update({
      accessToken: tokens.access_token,
      expiresAt: now + tokens.expires_in * 1000,
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    });

    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return null;
  }
}

// Helper: Sync a booking to Google Calendar
async function syncBookingToGoogleCalendar(booking, bookingId) {
  // Check if breeder has Google Calendar enabled
  const settingsDoc = await db.collection('schedulingSettings').doc(booking.breederId).get();
  if (!settingsDoc.exists) return;

  const settings = settingsDoc.data();
  if (!settings.googleCalendarEnabled) return;

  const accessToken = await getValidGoogleAccessToken(booking.breederId);
  if (!accessToken) return;

  const calendarId = settings.googleCalendarId || 'primary';

  const event = {
    summary: `${booking.appointmentTypeName} - ${booking.customerName}`,
    description: [
      `Customer: ${booking.customerName}`,
      `Email: ${booking.customerEmail || 'N/A'}`,
      `Phone: ${booking.customerPhone || 'N/A'}`,
      booking.notes ? `Notes: ${booking.notes}` : '',
      `\nBooking ID: ${bookingId}`,
      `Status: ${booking.status}`,
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: booking.startTime,
      timeZone: settings.timezone || 'America/New_York',
    },
    end: {
      dateTime: booking.endTime,
      timeZone: settings.timezone || 'America/New_York',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to create Google Calendar event:', error);
    return;
  }

  const createdEvent = await response.json();

  // Save the Google event ID on the booking for future updates
  await db.collection('bookings').doc(bookingId).update({
    googleEventId: createdEvent.id,
  });

  console.log(`Google Calendar event created: ${createdEvent.id} for booking ${bookingId}`);
}

// Sync booking updates (cancel/confirm) to Google Calendar
exports.onBookingUpdated = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const bookingId = context.params.bookingId;

    // Only act on status changes
    if (before.status === after.status) return;

    // Only sync if there's a Google event ID
    if (!after.googleEventId) return;

    try {
      const settingsDoc = await db.collection('schedulingSettings').doc(after.breederId).get();
      if (!settingsDoc.exists) return;

      const settings = settingsDoc.data();
      if (!settings.googleCalendarEnabled) return;

      const accessToken = await getValidGoogleAccessToken(after.breederId);
      if (!accessToken) return;

      const calendarId = settings.googleCalendarId || 'primary';

      if (after.status === 'cancelled') {
        // Cancel the Google Calendar event
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${after.googleEventId}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }
        );
        if (response.ok || response.status === 404) {
          console.log(`Google Calendar event deleted for cancelled booking ${bookingId}`);
        }
      } else {
        // Update the event description with new status
        const event = {
          summary: `${after.appointmentTypeName} - ${after.customerName}`,
          description: [
            `Customer: ${after.customerName}`,
            `Email: ${after.customerEmail || 'N/A'}`,
            `Phone: ${after.customerPhone || 'N/A'}`,
            after.notes ? `Notes: ${after.notes}` : '',
            `\nBooking ID: ${bookingId}`,
            `Status: ${after.status}`,
          ].filter(Boolean).join('\n'),
        };

        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${after.googleEventId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );
        console.log(`Google Calendar event updated for booking ${bookingId} (status: ${after.status})`);
      }
    } catch (error) {
      console.error('Error syncing booking update to Google Calendar:', error);
    }
  });

// Exchange Google OAuth authorization code for tokens
exports.exchangeGoogleCalendarCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { code, redirectUri } = data;
  if (!code || !redirectUri) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing code or redirectUri');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new functions.https.HttpsError('failed-precondition', 'Google Calendar integration is not configured');
  }

  try {
    // Exchange the authorization code for tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Google token exchange failed:', error);
      throw new functions.https.HttpsError('internal', 'Failed to exchange authorization code');
    }

    const tokens = await response.json();
    const now = Date.now();

    // Get the user's Google email from the ID token or userinfo
    let googleEmail = '';
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      });
      if (userinfoRes.ok) {
        const userinfo = await userinfoRes.json();
        googleEmail = userinfo.email || '';
      }
    } catch (e) {
      console.log('Could not fetch Google userinfo:', e);
    }

    // Save tokens securely in Firestore
    await db.collection('googleCalendarTokens').doc(context.auth.uid).set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: now + tokens.expires_in * 1000,
      scope: tokens.scope,
      googleEmail,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update scheduling settings
    await db.collection('schedulingSettings').doc(context.auth.uid).update({
      googleCalendarEnabled: true,
      googleCalendarId: 'primary',
    });

    return {
      success: true,
      googleEmail,
    };
  } catch (error) {
    console.error('Error exchanging Google Calendar code:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to connect Google Calendar');
  }
});

// Disconnect Google Calendar
exports.disconnectGoogleCalendar = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  try {
    // Get existing tokens to revoke
    const tokenDoc = await db.collection('googleCalendarTokens').doc(context.auth.uid).get();
    if (tokenDoc.exists) {
      const tokenData = tokenDoc.data();
      // Revoke the token with Google
      if (tokenData.accessToken) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
        } catch (e) {
          console.log('Token revocation failed (may already be revoked):', e);
        }
      }
      // Delete token document
      await db.collection('googleCalendarTokens').doc(context.auth.uid).delete();
    }

    // Update scheduling settings
    const settingsDoc = await db.collection('schedulingSettings').doc(context.auth.uid).get();
    if (settingsDoc.exists) {
      await db.collection('schedulingSettings').doc(context.auth.uid).update({
        googleCalendarEnabled: false,
        googleCalendarId: '',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to disconnect Google Calendar');
  }
});
