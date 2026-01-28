// Firebase Cloud Functions for Stripe Billing and Email Automation
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
admin.initializeApp();

const db = admin.firestore();

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
      const customer = await stripe.customers.create({
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
    const session = await stripe.checkout.sessions.create({
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
  const session = await stripe.billingPortal.sessions.create({
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
    event = stripe.webhooks.constructEvent(
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
