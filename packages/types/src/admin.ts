// Admin and user management types

export type SubscriptionTier = 'free' | 'builder' | 'pro';

export interface SubscriptionFeature {
  name: string;
  description: string;
  enabled: boolean;
}

export interface SubscriptionTierConfig {
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: Record<string, SubscriptionFeature>;
  maxDogs: number;
  maxLitters: number;
  maxCustomers: number;
  maxWaitlistEntries: number;
}

export interface CouponCode {
  code: string;
  description: string;
  type: 'percentage' | 'fixed'; // percentage or fixed amount discount
  value: number; // percentage (0-100) or fixed amount in dollars
  maxUses: number;
  usedCount: number;
  expiryDate: string; // ISO date string
  applicableTiers: SubscriptionTier[]; // which tiers this coupon applies to
  active: boolean;
}

export interface TrialConfig {
  durationDays: number; // how long the trial lasts
  tier: SubscriptionTier; // which tier the trial gives access to
  active: boolean;
}

// Platform email settings for sending notifications from expertbreeder.com
export type PlatformEmailTemplateType =
  | 'friend_request'
  | 'friend_accepted'
  | 'new_message'
  | 'connection_request'
  | 'connection_approved'
  | 'connection_declined';

export interface PlatformEmailTemplate {
  subject: string;
  body: string; // HTML or plain text with {{variable}} placeholders
}

export interface PlatformEmailSettings {
  enabled: boolean;
  sendGridApiKey: string; // Encrypted/masked in UI
  fromEmail: string; // e.g., notifications@expertbreeder.com
  fromName: string; // e.g., Expert Breeder
  replyToEmail: string; // e.g., support@expertbreeder.com
  templates: Record<PlatformEmailTemplateType, PlatformEmailTemplate>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  lastLogin?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  // Breeder info
  kennelName?: string;
  totalDogs?: number;
  totalLitters?: number;
  // Subscription info
  subscriptionTier?: SubscriptionTier;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  appliedCoupon?: string; // coupon code applied to this user
  trialEndDate?: string; // when trial expires
}

export interface AppSettings {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  allowSignups: boolean;
  maxDogsPerUser: number;
  maxLittersPerUser: number;
  featuresEnabled: {
    connections: boolean;
    waitlist: boolean;
    publicPages: boolean;
    emailNotifications: boolean;
  };
  globalRegistries?: string[]; // Admin-managed list of available registries
  // Subscription configuration
  subscriptionTiers?: Record<SubscriptionTier, SubscriptionTierConfig>;
  coupons?: CouponCode[];
  trial?: TrialConfig;
  defaultTier?: SubscriptionTier; // default tier for new users
  paymentsEnabled?: boolean; // whether the app is accepting payments
  // Platform email configuration for breeder-to-breeder communications
  platformEmail?: PlatformEmailSettings;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDogs: number;
  totalLitters: number;
  newUsersThisMonth: number;
}

// Audit Logging Types
export type AuditEventCategory =
  | 'auth'
  | 'user_management'
  | 'subscription'
  | 'settings'
  | 'content'
  | 'security'
  | 'data_export'
  | 'system';

export type AuditEventAction =
  | 'login'
  | 'logout'
  | 'signup'
  | 'role_change'
  | 'user_deactivate'
  | 'user_activate'
  | 'tier_change'
  | 'coupon_applied'
  | 'coupon_created'
  | 'coupon_deleted'
  | 'trial_started'
  | 'trial_ended'
  | 'settings_updated'
  | 'registry_added'
  | 'registry_removed'
  | 'breed_added'
  | 'breed_removed'
  | 'dog_created'
  | 'dog_updated'
  | 'dog_deleted'
  | 'litter_created'
  | 'litter_updated'
  | 'litter_deleted'
  | 'data_exported'
  | 'impersonation_started'
  | 'impersonation_ended'
  | 'maintenance_mode_toggled'
  | 'payment_processed'
  | 'payment_failed'
  | 'content_flagged'
  | 'content_moderated';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO date string
  category: AuditEventCategory;
  action: AuditEventAction;
  actorUid: string; // User who performed the action
  actorEmail: string;
  actorDisplayName: string;
  targetUid?: string; // User affected by the action (if applicable)
  targetEmail?: string;
  targetDisplayName?: string;
  description: string; // Human-readable description
  metadata?: Record<string, unknown>; // Additional context (old value, new value, etc.)
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditLogFilters {
  category?: AuditEventCategory;
  action?: AuditEventAction;
  actorUid?: string;
  targetUid?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  successOnly?: boolean;
}

// Analytics Types
export interface UserEngagementMetrics {
  activeUsers7Days: number;
  activeUsers30Days: number;
  activeUsers90Days: number;
  totalUsers: number;
  activationRate: number; // % of users who have added at least one dog
  averageSessionsPerUser: number;
}

export interface RevenueMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalSubscribers: number;
  freeUsers: number;
  builderUsers: number;
  proUsers: number;
  trialUsers: number;
  churnRate: number; // % of users who downgraded/cancelled this month
  conversionRate: number; // % of free users who upgraded
  averageRevenuePerUser: number;
  lifetimeValue: number;
}

export interface ContentMetrics {
  totalDogs: number;
  totalLitters: number;
  totalPuppies: number;
  totalCustomers: number;
  dogsAddedThisWeek: number;
  littersAddedThisWeek: number;
  averageDogsPerUser: number;
  averageLittersPerUser: number;
  popularBreeds: Array<{ breed: string; count: number }>;
  registrationTypes: Array<{ registry: string; count: number }>;
}

export interface GeographicMetrics {
  usersByCountry: Array<{ country: string; count: number }>;
  usersByRegion: Array<{ region: string; count: number }>;
}

export interface CohortData {
  month: string; // YYYY-MM
  newUsers: number;
  retained30Days: number;
  retained60Days: number;
  retained90Days: number;
  retentionRate30: number;
  retentionRate60: number;
  retentionRate90: number;
}

export interface AnalyticsDashboard {
  generatedAt: string;
  userEngagement: UserEngagementMetrics;
  revenue: RevenueMetrics;
  content: ContentMetrics;
  geographic?: GeographicMetrics;
  cohorts?: CohortData[];
  growth: {
    newUsersThisMonth: number;
    newUsersLastMonth: number;
    growthRate: number; // % change month-over-month
    newUsersThisWeek: number;
    newUsersLastWeek: number;
  };
}
