# Workflow Automation & Email Scheduling - Complete Implementation

## Overview

A comprehensive workflow automation and email scheduling system has been implemented for the breeder app. This system allows breeders to automate repetitive tasks, schedule emails for future delivery, and streamline customer communication.

## Features Implemented

### 1. Email Scheduling
- **Manual Scheduling**: Schedule emails to send at any future date/time
- **Timezone Support**: Respects user's timezone for accurate scheduling
- **Status Tracking**: Pending, sent, failed, and cancelled statuses
- **Cancel Capability**: Cancel pending scheduled emails before they send
- **Source Tracking**: Distinguishes between manually scheduled and workflow-generated emails

### 2. Workflow Automation
- **12 Trigger Types**: customer_created, customer_status_changed, litter_born, puppy_ready, days_after_pickup, puppy_birthday, no_response, payment_received, payment_overdue, waitlist_joined, heat_cycle_detected, manual
- **10 Condition Types**: Filter when workflows execute based on customer data, tags, status, etc.
- **10 Action Types**: send_email, schedule_email, send_sms, add_tag, remove_tag, change_status, create_task, create_interaction, webhook, wait
- **8 Default Workflow Templates**: Pre-built workflows for common scenarios (welcome emails, follow-ups, birthday wishes, etc.)
- **Execution Logging**: Track every workflow execution with detailed logs
- **Statistics Dashboard**: View workflow performance metrics

### 3. Integration with Email Templates
- Workflows can use email templates with variable replacement
- Variables are replaced with actual customer and breeder data
- Supports 30+ variables for comprehensive personalization

## Files Created/Modified

### TypeScript Types
- **src/types/workflow.ts** - Complete type definitions for workflows, triggers, conditions, actions, scheduled emails, and execution logs

### Zustand Stores
- **src/store/workflowStore.ts** - Workflow CRUD operations, execution logic, and Firestore integration
- **src/store/scheduledEmailStore.ts** - Scheduled email management with real-time sync

### React Components
- **src/components/WorkflowManager.tsx** - Main workflow management UI with list, create, edit, toggle, and delete capabilities
- **src/components/ScheduledEmailsManager.tsx** - Scheduled emails dashboard with search, filter, view, and cancel features
- **src/components/EmailCompose.tsx** - Enhanced with scheduling UI (date/time pickers, timezone display)

### Pages
- **src/pages/BreederSettings.tsx** - Added "Workflows" and "Scheduled Emails" tabs to settings

### Firebase Backend
- **functions/index.js** - Added 3 Cloud Functions:
  1. `processScheduledEmails` - Runs every minute to send pending emails
  2. `onCustomerCreated` - Triggers workflows when new customers are created
  3. `onCustomerUpdated` - Triggers workflows when customer status changes
- **functions/package.json** - Added node-fetch dependency

### Security
- **firestore.rules** - Added security rules for workflows, scheduledEmails, and workflowExecutionLogs collections

## Architecture

### Client-Side (Frontend)
```
User Interface
    ↓
Zustand Stores (workflowStore, scheduledEmailStore)
    ↓
Firestore SDK (read/write workflows and scheduled emails)
```

### Server-Side (Cloud Functions)
```
Scheduled Trigger (every minute)
    ↓
processScheduledEmails Function
    ↓
Query pending emails → Send via Gmail/Outlook API → Update status

Firestore Trigger (customer created/updated)
    ↓
onCustomerCreated / onCustomerUpdated
    ↓
Find matching workflows → Execute actions → Log results
```

## Data Flow

### Email Scheduling Flow
1. User composes email in EmailCompose component
2. User toggles "Schedule for Later" and selects date/time
3. Email data saved to Firestore `scheduledEmails` collection with status='pending'
4. Cloud Function runs every minute, queries pending emails where `scheduledFor <= now`
5. Function retrieves user's email integration (access token)
6. Function sends email via Gmail/Outlook API
7. Status updated to 'sent' or 'failed' with error message

### Workflow Execution Flow
1. User creates workflow in WorkflowManager
2. Workflow saved to Firestore with trigger, conditions, and actions
3. When trigger event occurs (e.g., customer created):
   - Firestore trigger fires Cloud Function
   - Function finds all active workflows with matching trigger
   - Function evaluates conditions
   - If conditions met, function executes actions sequentially
   - Results logged to workflowExecutionLogs collection
   - Workflow statistics updated (timesTriggered, lastTriggered)

## Usage Guide

### For Users

#### Creating a Workflow
1. Go to Settings → Workflows tab
2. Click "Create Workflow" or "Initialize Default Workflows"
3. Configure:
   - Name and description
   - Trigger (when workflow runs)
   - Conditions (optional filters)
   - Actions (what happens)
4. Toggle workflow active/inactive
5. Monitor execution statistics

#### Scheduling an Email
1. Go to Customers page
2. Click "Compose" for a customer
3. Fill in email details or select a template
4. Toggle "Schedule for Later"
5. Select date and time
6. Click "Send Email" (will actually schedule it)

#### Managing Scheduled Emails
1. Go to Settings → Scheduled Emails tab
2. View all scheduled emails with status
3. Filter by status or search by content
4. Click "View" to see full email details
5. Click "Cancel" to cancel pending emails

### For Developers

#### Adding New Trigger Types
1. Add trigger type to `TriggerType` in `src/types/workflow.ts`
2. Update `TRIGGER_LABELS` in `src/components/WorkflowManager.tsx`
3. Create Firestore trigger in `functions/index.js` (e.g., `exports.onLitterCreated`)
4. Call `executeWorkflow` with appropriate context

#### Adding New Action Types
1. Add action type to `ActionType` in `src/types/workflow.ts`
2. Update `ACTION_LABELS` in `src/components/WorkflowManager.tsx`
3. Implement action logic in:
   - `executeAction` function in `src/store/workflowStore.ts` (client-side)
   - `executeAction` function in `functions/index.js` (server-side)

#### Adding New Condition Types
1. Add condition type to `ConditionType` in `src/types/workflow.ts`
2. Implement evaluation logic in:
   - `evaluateConditions` function in `src/store/workflowStore.ts`
   - `evaluateConditions` function in `functions/index.js`

## Deployment

### Deploying Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploying Cloud Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Enabling Scheduled Functions
The `processScheduledEmails` function uses Cloud Scheduler, which requires:
1. Firebase Blaze plan (pay-as-you-go)
2. Cloud Scheduler API enabled in Google Cloud Console
3. First deployment will create the scheduled job automatically

## Testing

### Test Email Scheduling
1. Schedule an email for 2 minutes in the future
2. Wait for Cloud Function to process (runs every minute)
3. Check email inbox for delivery
4. Verify status changed to 'sent' in Scheduled Emails page

### Test Workflow Automation
1. Create workflow with "Customer Created" trigger
2. Add action "Send Email" with a template
3. Set workflow to active
4. Create a new customer in Customers page
5. Check workflow execution logs
6. Verify email was scheduled/sent

## Security Considerations

### Firestore Rules
- Users can only read/write their own workflows, scheduled emails, and execution logs
- All operations require authentication
- Data is scoped by `userId` field

### OAuth Tokens
- Access tokens stored in Firestore (consider encryption for production)
- Tokens refreshed automatically when expired
- Each user has their own OAuth credentials

### Cloud Functions
- Functions run with admin privileges
- Validate data before processing
- Log all errors for debugging
- Rate limit: Max 50 emails per minute per function execution

## Performance Optimization

### Firestore Indexes
Recommended composite indexes:
```
scheduledEmails:
  - userId ASC, status ASC, scheduledFor ASC

workflows:
  - userId ASC, isActive ASC, trigger.type ASC

workflowExecutionLogs:
  - userId ASC, triggeredAt DESC
```

### Function Optimization
- Batch operations where possible
- Use Promise.all for parallel processing
- Limit query results (e.g., 50 emails per run)
- Cache frequently accessed data (templates, profiles)

## Monitoring

### Cloud Function Logs
View logs in Firebase Console:
1. Go to Functions tab
2. Select function (processScheduledEmails, onCustomerCreated, etc.)
3. View execution logs, errors, and performance

### Firestore Usage
Monitor Firestore reads/writes in Firebase Console:
1. Go to Firestore Database
2. Check Usage tab
3. Review reads, writes, and deletes

## Future Enhancements

### Potential Additions
1. **Email Sync**: Import emails from Gmail/Outlook into customer interactions
2. **SMS Integration**: Add Twilio for SMS workflows
3. **Advanced Scheduling**: Recurring emails, relative scheduling (e.g., "3 days after deposit")
4. **A/B Testing**: Test different email templates in workflows
5. **Workflow Builder UI**: Visual drag-and-drop workflow designer
6. **Bulk Operations**: Schedule emails to multiple customers at once
7. **Email Analytics**: Track open rates, click rates (requires email tracking service)
8. **Workflow Templates Marketplace**: Share workflows with other breeders
9. **AI-Powered Triggers**: Smart triggers based on customer behavior
10. **Mobile Push Notifications**: Integrate with Firebase Cloud Messaging

## Troubleshooting

### Emails Not Sending
1. Check Cloud Function logs for errors
2. Verify email integration is active and has valid access token
3. Check scheduled email status (should be 'pending' before send time)
4. Ensure Cloud Scheduler is enabled and function is deployed

### Workflows Not Triggering
1. Verify workflow is set to active
2. Check trigger type matches the event
3. Review conditions (may be filtering out execution)
4. Check Firestore triggers are deployed
5. View execution logs for detailed error messages

### Permission Errors
1. Verify Firestore rules are deployed
2. Check user is authenticated
3. Ensure userId matches authenticated user
4. Review Cloud Function IAM permissions

## API Reference

### WorkflowStore Methods
- `loadWorkflows(userId)` - Load all workflows for user
- `subscribeToWorkflows(userId)` - Real-time workflow updates
- `createWorkflow(workflowData)` - Create new workflow
- `updateWorkflow(id, updates)` - Update existing workflow
- `deleteWorkflow(id)` - Delete workflow
- `toggleWorkflow(id, isActive)` - Activate/deactivate workflow
- `initializeDefaultWorkflows(userId)` - Create default workflow templates
- `executeWorkflow(workflowId, context)` - Manually execute workflow

### ScheduledEmailStore Methods
- `loadScheduledEmails(userId)` - Load all scheduled emails
- `subscribeToScheduledEmails(userId)` - Real-time updates
- `scheduleEmail(emailData)` - Schedule new email
- `cancelScheduledEmail(id)` - Cancel pending email
- `updateScheduledEmail(id, updates)` - Update scheduled email
- `getPendingEmails(userId)` - Get emails ready to send

## Support

For questions or issues:
1. Check this documentation
2. Review Cloud Function logs
3. Check Firestore rules
4. Verify OAuth integration is configured
5. Test with simple workflow first

## Conclusion

The workflow automation and email scheduling system is now fully implemented and ready for use. Breeders can automate their customer communication, save time, and provide better service to their clients. The system is scalable, secure, and extensible for future enhancements.
