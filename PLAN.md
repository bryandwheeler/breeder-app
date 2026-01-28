# Email Marketing System Implementation Plan

## Overview

Build a comprehensive email marketing system similar to AWeber/GetResponse with two separate but architecturally similar systems:

1. **Admin Newsletter System** - Platform-wide communications to all users/subscribers
2. **Breeder Email System** - Enhanced version of existing workflow emails for breeder-to-customer communications

Both systems will use SendGrid as the email backend with full analytics tracking.

---

## Phase 1: SendGrid Integration & Core Infrastructure

### 1.1 SendGrid Setup

**New Files:**
- `packages/firebase/src/config/sendgrid.ts` - SendGrid configuration
- `apps/web/src/lib/sendgridService.ts` - Client-side SendGrid utilities
- `functions/sendgrid.js` - Server-side SendGrid operations

**Cloud Functions to Add:**
```javascript
// Send single email via SendGrid
exports.sendEmail = functions.https.onCall(...)

// Send bulk emails (newsletter blast)
exports.sendBulkEmail = functions.https.onCall(...)

// Process SendGrid webhooks (opens, clicks, bounces, unsubscribes)
exports.sendgridWebhook = functions.https.onRequest(...)
```

**Environment Variables:**
- `SENDGRID_API_KEY` - API key for sending
- `SENDGRID_WEBHOOK_KEY` - Webhook signature verification

### 1.2 Core Database Schema

**New Firestore Collections:**

```
// Newsletter subscriber lists (Admin-level)
newsletterLists/{listId}
  - name: string
  - description: string
  - subscriberCount: number
  - createdAt: timestamp
  - updatedAt: timestamp
  - tags: string[]
  - isDefault: boolean

// Subscribers (platform-wide)
newsletterSubscribers/{subscriberId}
  - email: string
  - firstName: string
  - lastName: string
  - listIds: string[]  // Which lists they're on
  - status: 'active' | 'unsubscribed' | 'bounced' | 'complained'
  - source: 'signup_form' | 'import' | 'manual' | 'lead_magnet'
  - leadMagnetId: string | null
  - customFields: Record<string, any>
  - engagementScore: number
  - createdAt: timestamp
  - unsubscribedAt: timestamp | null
  - lastEmailAt: timestamp | null
  - lastOpenAt: timestamp | null
  - lastClickAt: timestamp | null

// Email campaigns (one-time sends)
emailCampaigns/{campaignId}
  - name: string
  - subject: string
  - preheaderText: string
  - htmlContent: string
  - textContent: string
  - listIds: string[]
  - segmentRules: SegmentRule[]
  - status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  - scheduledFor: timestamp | null
  - sentAt: timestamp | null
  - ownerId: string  // Admin UID or breeder UID
  - ownerType: 'admin' | 'breeder'
  - stats: {
      sent: number
      delivered: number
      opened: number
      clicked: number
      bounced: number
      unsubscribed: number
      complained: number
    }
  - createdAt: timestamp
  - updatedAt: timestamp

// Autoresponder sequences
autoresponderSequences/{sequenceId}
  - name: string
  - description: string
  - trigger: 'list_subscribe' | 'tag_added' | 'lead_magnet' | 'manual'
  - triggerListId: string | null
  - triggerLeadMagnetId: string | null
  - isActive: boolean
  - ownerId: string
  - ownerType: 'admin' | 'breeder'
  - createdAt: timestamp
  - updatedAt: timestamp

// Individual emails in a sequence
autoresponderEmails/{emailId}
  - sequenceId: string
  - order: number  // 1, 2, 3...
  - delayDays: number  // Days after previous email (0 = immediately)
  - delayHours: number
  - subject: string
  - preheaderText: string
  - htmlContent: string
  - textContent: string
  - isActive: boolean
  - stats: { sent, opened, clicked }
  - createdAt: timestamp

// Track subscriber progress through sequences
subscriberSequenceProgress/{progressId}
  - subscriberId: string
  - sequenceId: string
  - currentEmailIndex: number
  - status: 'active' | 'completed' | 'paused' | 'unsubscribed'
  - startedAt: timestamp
  - nextEmailAt: timestamp
  - completedAt: timestamp | null
  - emailsSent: number

// Lead magnets (ebooks, PDFs, etc.)
leadMagnets/{magnetId}
  - name: string
  - description: string
  - fileUrl: string  // Storage URL
  - fileName: string
  - fileSize: number
  - thumbnailUrl: string | null
  - downloadCount: number
  - sequenceId: string | null  // Optional: auto-start sequence
  - ownerId: string
  - ownerType: 'admin' | 'breeder'
  - createdAt: timestamp

// Signup/opt-in forms
signupForms/{formId}
  - name: string
  - listIds: string[]
  - leadMagnetId: string | null
  - sequenceId: string | null
  - fields: FormField[]
  - styling: FormStyling
  - successMessage: string
  - embedCode: string
  - ownerId: string
  - ownerType: 'admin' | 'breeder'
  - submissions: number
  - conversions: number
  - createdAt: timestamp

// Email analytics events (for detailed tracking)
emailEvents/{eventId}
  - campaignId: string | null
  - autoresponderEmailId: string | null
  - subscriberId: string
  - email: string
  - eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'complained'
  - linkUrl: string | null  // For click events
  - userAgent: string | null
  - ipAddress: string | null
  - timestamp: timestamp
```

---

## Phase 2: Admin Newsletter System

### 2.1 Admin UI Components

**New Pages:**
- `apps/web/src/pages/admin/Newsletter.tsx` - Main dashboard
- `apps/web/src/pages/admin/NewsletterLists.tsx` - Manage subscriber lists
- `apps/web/src/pages/admin/NewsletterSubscribers.tsx` - View/manage subscribers
- `apps/web/src/pages/admin/NewsletterCampaigns.tsx` - Create/manage campaigns
- `apps/web/src/pages/admin/NewsletterSequences.tsx` - Autoresponder sequences
- `apps/web/src/pages/admin/NewsletterLeadMagnets.tsx` - Manage lead magnets
- `apps/web/src/pages/admin/NewsletterForms.tsx` - Signup form builder
- `apps/web/src/pages/admin/NewsletterAnalytics.tsx` - Analytics dashboard

**New Components:**
- `EmailCampaignEditor.tsx` - Rich email builder with drag-and-drop
- `SequenceBuilder.tsx` - Visual sequence/flow builder
- `SubscriberTable.tsx` - Paginated subscriber list with filters
- `SignupFormBuilder.tsx` - Form builder with preview
- `LeadMagnetUploader.tsx` - File upload with delivery settings
- `EmailAnalyticsCharts.tsx` - Charts for opens, clicks, etc.
- `SubscriberImporter.tsx` - CSV import with field mapping

### 2.2 Admin Features

1. **List Management**
   - Create multiple subscriber lists
   - Segment by tags, engagement, source
   - Bulk operations (tag, move, delete)

2. **Campaign Creation**
   - Rich HTML email editor
   - Template library
   - A/B testing (subject lines)
   - Schedule for later
   - Preview and test send

3. **Autoresponder Sequences**
   - Visual sequence builder
   - Delay configuration (days/hours)
   - Conditional branching (opened/clicked)
   - Sequence triggers (list join, tag, lead magnet)

4. **Lead Magnets**
   - Upload PDFs, ebooks, resources
   - Auto-deliver on form submission
   - Track downloads

5. **Signup Forms**
   - Drag-and-drop form builder
   - Embed code generator
   - Custom styling options
   - Success/thank you messages

6. **Analytics**
   - Campaign performance
   - Subscriber growth
   - Engagement metrics
   - Deliverability stats

---

## Phase 3: Breeder Email Enhancements

### 3.1 Extend Existing Infrastructure

Build on the existing `customers`, `emailTemplates`, `workflows`, and `scheduledEmails` collections.

**Enhancements to existing:**
- Add engagement tracking to customer emails
- Add sequence support to workflows
- Add lead magnet delivery for breeders

### 3.2 Breeder-Specific Features

**New Pages:**
- `apps/web/src/pages/EmailMarketing.tsx` - Breeder email hub
- `apps/web/src/pages/EmailSequences.tsx` - Breeder autoresponders

**Breeder Capabilities:**
1. **Email Choice**
   - Use system SendGrid (simple, no setup)
   - Use own Gmail/Outlook (existing integration)
   - Configuration wizard to help choose

2. **Customer Sequences**
   - Pre-built sequences for common journeys:
     - New inquiry → Follow-up series
     - Deposit received → Countdown to pickup
     - Post-pickup → Check-in series
     - Annual birthday wishes

3. **Lead Magnets for Breeders**
   - Breed guides, puppy care PDFs
   - Embed on their public website
   - Auto-add to customer list

4. **Enhanced Templates**
   - More template categories
   - Visual template editor
   - Brand customization

---

## Phase 4: Cloud Functions & Automation

### 4.1 New Cloud Functions

```javascript
// Process autoresponder queues (runs every 5 minutes)
exports.processAutoresponderQueue = functions.pubsub.schedule('every 5 minutes')

// Handle SendGrid webhooks
exports.sendgridWebhook = functions.https.onRequest(async (req, res) => {
  // Verify signature
  // Process events: delivered, opened, clicked, bounced, unsubscribed, spam_report
  // Update subscriber records and campaign stats
})

// Send campaign emails (triggered by campaign scheduling)
exports.sendCampaign = functions.https.onCall(async (data, context) => {
  // Validate permissions
  // Queue emails to SendGrid
  // Create email events
})

// Deliver lead magnet
exports.deliverLeadMagnet = functions.https.onCall(async (data, context) => {
  // Verify form submission
  // Send email with download link
  // Track delivery
})

// Public form submission endpoint
exports.submitSignupForm = functions.https.onRequest(async (req, res) => {
  // CORS handling
  // Validate form
  // Create/update subscriber
  // Trigger lead magnet delivery
  // Start autoresponder sequence
})
```

### 4.2 Scheduled Jobs

- **Every 1 minute**: Process scheduled campaigns
- **Every 5 minutes**: Process autoresponder queue
- **Daily**: Update engagement scores
- **Weekly**: Clean up bounced/unsubscribed

---

## Phase 5: Security & Permissions

### 5.1 Firestore Rules

```javascript
// Newsletter collections - Admin only
match /newsletterLists/{listId} {
  allow read, write: if isAdmin();
}

match /newsletterSubscribers/{subscriberId} {
  allow read, write: if isAdmin();
}

match /emailCampaigns/{campaignId} {
  allow read, write: if isAdmin() ||
    (resource.data.ownerId == request.auth.uid && resource.data.ownerType == 'breeder');
}

// Similar patterns for sequences, lead magnets, forms
```

### 5.2 Rate Limiting

- Campaign sends: Max 10,000/hour per account
- Form submissions: Max 100/hour per form
- API calls: Standard Firebase limits

---

## Implementation Order

### Sprint 1: Foundation (Week 1-2)
1. SendGrid integration
2. Core database schema
3. Newsletter subscriber CRUD
4. Basic list management

### Sprint 2: Campaign System (Week 3-4)
1. Email campaign editor
2. Campaign sending
3. SendGrid webhooks
4. Basic analytics

### Sprint 3: Autoresponders (Week 5-6)
1. Sequence builder UI
2. Sequence processing function
3. Trigger configuration
4. Progress tracking

### Sprint 4: Lead Magnets & Forms (Week 7-8)
1. Lead magnet upload/management
2. Signup form builder
3. Embed code generator
4. Form submission handling

### Sprint 5: Breeder Integration (Week 9-10)
1. Breeder email hub
2. Pre-built sequences
3. Email provider choice
4. Customer integration

### Sprint 6: Analytics & Polish (Week 11-12)
1. Analytics dashboard
2. Engagement scoring
3. A/B testing
4. Documentation

---

## Files to Create/Modify

### New Files (approximately 35-40 files)

**Types:**
- `packages/types/src/newsletter.ts`
- `packages/types/src/campaign.ts`
- `packages/types/src/autoresponder.ts`
- `packages/types/src/leadMagnet.ts`
- `packages/types/src/signupForm.ts`

**Stores:**
- `packages/firebase/src/stores/newsletterStore.ts`
- `packages/firebase/src/stores/campaignStore.ts`
- `packages/firebase/src/stores/autoresponderStore.ts`
- `packages/firebase/src/stores/leadMagnetStore.ts`
- `packages/firebase/src/stores/signupFormStore.ts`

**Admin Pages:**
- `apps/web/src/pages/admin/Newsletter.tsx`
- `apps/web/src/pages/admin/NewsletterLists.tsx`
- `apps/web/src/pages/admin/NewsletterSubscribers.tsx`
- `apps/web/src/pages/admin/NewsletterCampaigns.tsx`
- `apps/web/src/pages/admin/NewsletterSequences.tsx`
- `apps/web/src/pages/admin/NewsletterLeadMagnets.tsx`
- `apps/web/src/pages/admin/NewsletterForms.tsx`
- `apps/web/src/pages/admin/NewsletterAnalytics.tsx`

**Breeder Pages:**
- `apps/web/src/pages/EmailMarketing.tsx`
- `apps/web/src/pages/EmailSequences.tsx`

**Components (15-20):**
- Campaign editor, sequence builder, subscriber table, form builder, analytics charts, etc.

**Cloud Functions:**
- Add to `functions/index.js` or create `functions/newsletter.js`

**Firestore Rules:**
- Update `firestore.rules`

### Modified Files

- `apps/web/src/App.tsx` - Add routes
- `apps/web/src/components/Sidebar.tsx` - Add menu items
- `apps/web/src/components/AdminSidebar.tsx` - Add admin menu items
- `packages/types/src/index.ts` - Export new types
- `packages/firebase/src/index.ts` - Export new stores

---

## Technical Considerations

1. **SendGrid Setup**: User needs to create SendGrid account, verify domain, get API key
2. **Email Deliverability**: Configure SPF, DKIM, DMARC for domain
3. **Unsubscribe Handling**: Must include unsubscribe link in all emails (CAN-SPAM)
4. **GDPR Compliance**: Double opt-in option, data export, deletion
5. **Storage**: Lead magnet files stored in Firebase Storage
6. **Scalability**: Use batch operations for bulk sends, paginate large lists

---

## Cost Estimates

- **SendGrid**: Free tier (100/day), then $20/mo for 50k
- **Firebase Functions**: Included in current usage
- **Firebase Storage**: ~$0.026/GB for lead magnets
- **Firestore**: Minimal additional reads/writes

Total additional cost: ~$20-50/month at moderate scale
