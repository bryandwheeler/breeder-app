/**
 * Newsletter and Email Marketing Types
 *
 * Comprehensive type definitions for the email marketing system
 * including subscribers, lists, campaigns, autoresponders, and analytics.
 */

// ============================================================================
// Subscriber Types
// ============================================================================

export type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained' | 'pending';

export type SubscriberSource = 'signup_form' | 'import' | 'manual' | 'lead_magnet' | 'api';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  listIds: string[];
  tags: string[];
  status: SubscriberStatus;
  source: SubscriberSource;
  sourceDetails?: string; // e.g., form name, import batch ID
  leadMagnetId?: string;
  customFields: Record<string, string | number | boolean>;
  engagementScore: number; // 0-100
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string; // For double opt-in
  unsubscribedAt?: string;
  lastEmailAt?: string;
  lastOpenAt?: string;
  lastClickAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface NewsletterList {
  id: string;
  name: string;
  description: string;
  subscriberCount: number;
  activeCount: number;
  tags: string[];
  isDefault: boolean;
  doubleOptIn: boolean;
  welcomeEmailId?: string; // Auto-send on subscribe
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Campaign Types
// ============================================================================

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';

export type CampaignType = 'regular' | 'ab_test' | 'automated';

export interface SegmentRule {
  field: string; // e.g., 'tags', 'engagementScore', 'lastOpenAt'
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean | string[];
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  uniqueOpens: number;
  clicked: number;
  uniqueClicks: number;
  bounced: number;
  softBounced: number;
  hardBounced: number;
  unsubscribed: number;
  complained: number;
  openRate: number; // Percentage
  clickRate: number; // Percentage
  bounceRate: number; // Percentage
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  preheaderText: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  htmlContent: string;
  textContent: string;
  templateId?: string;
  listIds: string[];
  excludeListIds: string[];
  segmentRules: SegmentRule[];
  segmentMatchType: 'all' | 'any'; // AND vs OR
  type: CampaignType;
  status: CampaignStatus;
  scheduledFor?: string;
  sentAt?: string;
  completedAt?: string;
  ownerId: string;
  ownerType: 'admin' | 'breeder';
  stats: CampaignStats;
  // A/B Testing
  abTestEnabled: boolean;
  abTestSubjectB?: string;
  abTestPercentage?: number; // % to test before winner
  abTestWinnerCriteria?: 'open_rate' | 'click_rate';
  abTestDuration?: number; // Hours to wait before picking winner
  // Tracking
  trackOpens: boolean;
  trackClicks: boolean;
  googleAnalytics?: {
    enabled: boolean;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Autoresponder Types
// ============================================================================

export type AutoresponderTrigger =
  | 'list_subscribe'
  | 'tag_added'
  | 'tag_removed'
  | 'lead_magnet'
  | 'form_submit'
  | 'date_field' // e.g., birthday, anniversary
  | 'manual';

export type AutoresponderStatus = 'active' | 'paused' | 'draft';

export interface AutoresponderSequence {
  id: string;
  name: string;
  description: string;
  trigger: AutoresponderTrigger;
  triggerConfig: {
    listId?: string;
    tagName?: string;
    leadMagnetId?: string;
    formId?: string;
    dateField?: string;
    daysOffset?: number; // For date triggers, e.g., -7 for 7 days before
  };
  status: AutoresponderStatus;
  emailCount: number;
  subscribersActive: number; // Currently in sequence
  subscribersCompleted: number;
  ownerId: string;
  ownerType: 'admin' | 'breeder';
  createdAt: string;
  updatedAt: string;
}

export interface AutoresponderEmail {
  id: string;
  sequenceId: string;
  order: number;
  name: string; // Internal name for reference
  subject: string;
  preheaderText: string;
  htmlContent: string;
  textContent: string;
  templateId?: string;
  delayDays: number;
  delayHours: number;
  delayMinutes: number;
  sendAtTime?: string; // HH:MM - specific time to send
  sendOnDays?: number[]; // 0-6, Sun-Sat - only send on these days
  isActive: boolean;
  // Conditional sending
  conditions?: {
    onlyIfOpened?: string; // Previous email ID
    onlyIfClicked?: string; // Previous email ID
    skipIfOpened?: string;
    skipIfClicked?: string;
  };
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type SequenceProgressStatus = 'active' | 'completed' | 'paused' | 'unsubscribed' | 'bounced';

export interface SubscriberSequenceProgress {
  id: string;
  subscriberId: string;
  subscriberEmail: string;
  sequenceId: string;
  currentEmailIndex: number;
  status: SequenceProgressStatus;
  startedAt: string;
  nextEmailAt?: string;
  completedAt?: string;
  pausedAt?: string;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
}

// ============================================================================
// Lead Magnet Types
// ============================================================================

export type LeadMagnetType = 'pdf' | 'ebook' | 'video' | 'audio' | 'zip' | 'other';

export interface LeadMagnet {
  id: string;
  name: string;
  description: string;
  type: LeadMagnetType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadCount: number;
  // Delivery settings
  deliveryMethod: 'email' | 'redirect' | 'both';
  deliveryEmailSubject?: string;
  deliveryEmailContent?: string;
  redirectUrl?: string;
  // Automation
  addToListIds: string[];
  addTags: string[];
  sequenceId?: string; // Start autoresponder after delivery
  // Access
  requireEmailConfirmation: boolean;
  ownerId: string;
  ownerType: 'admin' | 'breeder';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Signup Form Types
// ============================================================================

export type FormFieldType = 'email' | 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'phone' | 'date';

export interface FormField {
  id: string;
  type: FormFieldType;
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio
  defaultValue?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  mapToField?: string; // Map to subscriber field: firstName, lastName, customFields.xxx
}

export interface FormStyling {
  theme: 'light' | 'dark' | 'custom';
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: number;
  fontFamily: string;
  fontSize: number;
  padding: number;
  showLabels: boolean;
  buttonText: string;
  width: 'auto' | 'full' | number;
}

export interface SignupForm {
  id: string;
  name: string;
  description?: string;
  listIds: string[];
  addTags: string[];
  leadMagnetId?: string;
  sequenceId?: string;
  fields: FormField[];
  styling: FormStyling;
  // Messages
  successMessage: string;
  successRedirectUrl?: string;
  alreadySubscribedMessage: string;
  errorMessage: string;
  // Double opt-in
  requireConfirmation: boolean;
  confirmationEmailSubject?: string;
  confirmationEmailContent?: string;
  // Embed
  embedCode?: string;
  hostedUrl?: string;
  // Stats
  views: number;
  submissions: number;
  conversions: number; // Confirmed subscribers
  conversionRate: number;
  // Access
  ownerId: string;
  ownerType: 'admin' | 'breeder';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Email Event Types (Analytics)
// ============================================================================

export type EmailEventType =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'soft_bounced'
  | 'unsubscribed'
  | 'complained'
  | 'dropped';

export interface EmailEvent {
  id: string;
  campaignId?: string;
  autoresponderEmailId?: string;
  sequenceId?: string;
  subscriberId: string;
  email: string;
  eventType: EmailEventType;
  timestamp: string;
  // Event details
  linkUrl?: string; // For click events
  bounceType?: 'hard' | 'soft';
  bounceReason?: string;
  // Metadata
  userAgent?: string;
  ipAddress?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  emailClient?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

// ============================================================================
// Analytics & Reporting Types
// ============================================================================

export interface NewsletterAnalytics {
  period: 'day' | 'week' | 'month' | 'year' | 'all';
  startDate: string;
  endDate: string;
  // Subscriber metrics
  totalSubscribers: number;
  newSubscribers: number;
  unsubscribes: number;
  netGrowth: number;
  growthRate: number;
  // Engagement metrics
  emailsSent: number;
  emailsDelivered: number;
  deliveryRate: number;
  totalOpens: number;
  uniqueOpens: number;
  openRate: number;
  totalClicks: number;
  uniqueClicks: number;
  clickRate: number;
  clickToOpenRate: number;
  // Health metrics
  bounceRate: number;
  complaintRate: number;
  unsubscribeRate: number;
  // Top performers
  topCampaigns: Array<{
    id: string;
    name: string;
    openRate: number;
    clickRate: number;
  }>;
  topLinks: Array<{
    url: string;
    clicks: number;
  }>;
}

export interface SubscriberGrowthData {
  date: string;
  subscribers: number;
  newSubscribers: number;
  unsubscribes: number;
}

export interface EngagementData {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

// ============================================================================
// Template Types
// ============================================================================

export type NewsletterTemplateCategory =
  | 'welcome'
  | 'newsletter'
  | 'announcement'
  | 'promotion'
  | 'educational'
  | 'transactional'
  | 're-engagement'
  | 'custom';

export interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  category: NewsletterTemplateCategory;
  subject: string;
  preheaderText: string;
  htmlContent: string;
  textContent: string;
  thumbnailUrl?: string;
  isDefault: boolean;
  isPublic: boolean; // Available to all breeders
  ownerId?: string;
  ownerType?: 'admin' | 'breeder';
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SendGrid Integration Types
// ============================================================================

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  webhookUrl?: string;
  isConfigured: boolean;
  lastVerified?: string;
}

export interface SendGridWebhookEvent {
  email: string;
  timestamp: number;
  event: string;
  sg_event_id: string;
  sg_message_id: string;
  category?: string[];
  url?: string;
  reason?: string;
  status?: string;
  type?: string;
  useragent?: string;
  ip?: string;
}

// ============================================================================
// Import/Export Types
// ============================================================================

export interface ImportJob {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  listIds: string[];
  addTags: string[];
  fieldMapping: Record<string, string>; // CSV column -> subscriber field
  totalRows: number;
  processedRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  ownerId: string;
  startedAt: string;
  completedAt?: string;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  listIds: string[];
  filters: SegmentRule[];
  fields: string[];
  format: 'csv' | 'xlsx';
  fileUrl?: string;
  totalRecords: number;
  ownerId: string;
  startedAt: string;
  completedAt?: string;
  expiresAt?: string;
}
