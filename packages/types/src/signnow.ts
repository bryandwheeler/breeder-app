// SignNow Contract Management Types
// E-signature integration for breeder contracts

// ============================================================================
// SignNow Configuration Types
// ============================================================================

/**
 * Admin-level SignNow API configuration
 * Stored in adminSettings/signNow
 */
export interface SignNowConfig {
  /** SignNow API base URL */
  apiUrl: string; // 'https://api.signnow.com' or 'https://api-eval.signnow.com' (sandbox)
  /** OAuth2 Client ID */
  clientId: string;
  /** OAuth2 Client Secret (should be encrypted at rest) */
  clientSecret: string;
  /** Base64 encoded clientId:clientSecret for Basic Auth */
  basicAuthToken: string;
  /** Webhook secret for signature verification */
  webhookSecret: string;
  /** Whether SignNow is configured and ready to use */
  isConfigured: boolean;
  /** Whether to use sandbox/test mode */
  testMode: boolean;
  /** Last verification timestamp */
  lastVerified?: string;
  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * Default SignNow configuration values
 */
export const DEFAULT_SIGNNOW_CONFIG: SignNowConfig = {
  apiUrl: 'https://api-eval.signnow.com', // Sandbox by default
  clientId: '',
  clientSecret: '',
  basicAuthToken: '',
  webhookSecret: '',
  isConfigured: false,
  testMode: true,
};

// ============================================================================
// Contract Template Types
// ============================================================================

/**
 * Types of contract templates breeders can create
 */
export type ContractTemplateType =
  | 'puppy_sale'
  | 'health_guarantee'
  | 'breeding_rights'
  | 'co_ownership'
  | 'stud_service'
  | 'guardian_home'
  | 'custom';

/**
 * Human-readable labels for contract template types
 */
export const CONTRACT_TEMPLATE_TYPE_LABELS: Record<ContractTemplateType, string> = {
  puppy_sale: 'Puppy Sale Contract',
  health_guarantee: 'Health Guarantee',
  breeding_rights: 'Breeding Rights Agreement',
  co_ownership: 'Co-Ownership Agreement',
  stud_service: 'Stud Service Contract',
  guardian_home: 'Guardian Home Agreement',
  custom: 'Custom Contract',
};

/**
 * Field types that can be placed on a contract
 */
export type SignNowFieldType = 'signature' | 'initial' | 'text' | 'date' | 'checkbox';

/**
 * Roles that can sign a contract
 */
export type SignNowFieldRole = 'breeder' | 'buyer' | 'co_owner' | 'guardian' | 'witness';

/**
 * Field definition for a contract template
 * Defines where and what type of field appears on the document
 */
export interface SignNowFieldDefinition {
  id: string;
  /** Field name/label */
  name: string;
  /** Type of field */
  type: SignNowFieldType;
  /** Which signer role fills this field */
  role: SignNowFieldRole;
  /** Whether the field is required */
  required: boolean;
  /** Page number (1-indexed) */
  page: number;
  /** X position as percentage from left (0-100) */
  x: number;
  /** Y position as percentage from top (0-100) */
  y: number;
  /** Width as percentage */
  width: number;
  /** Height as percentage */
  height: number;
  /** Placeholder text */
  placeholder?: string;
  /** Map to data field for auto-fill (e.g., 'buyer_name', 'price') */
  prefillField?: string;
}

/**
 * Reusable contract template
 * Stored in breederProfiles/{userId}/contractTemplates/{templateId}
 */
export interface SignNowContractTemplate {
  id: string;
  /** Breeder who owns this template */
  userId: string;
  /** Template name */
  name: string;
  /** Optional description */
  description?: string;
  /** Type of contract */
  type: ContractTemplateType;

  /** Source of the template document */
  sourceType: 'upload' | 'generated' | 'signnow_template';
  /** SignNow template ID if from their system */
  signNowTemplateId?: string;
  /** Firebase Storage URL if uploaded locally */
  localPdfUrl?: string;

  /** Field definitions for signing */
  fields: SignNowFieldDefinition[];

  /** Variable placeholders for merge (e.g., '{{buyer_name}}', '{{puppy_name}}') */
  variables: string[];

  /** Default expiration in days */
  defaultExpirationDays: number;
  /** Whether to require initials on each page */
  requireInitials: boolean;
  /** Whether to require date fields */
  requireDateFields: boolean;

  /** Usage statistics */
  usageCount: number;
  lastUsedAt?: string;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Contract (Document Instance) Types
// ============================================================================

/**
 * Status of a contract throughout its lifecycle
 */
export type ContractStatus =
  | 'draft'              // Created but not sent
  | 'pending_upload'     // Waiting to be uploaded to SignNow
  | 'sent'               // Sent to signers
  | 'viewed'             // At least one signer has viewed
  | 'partially_signed'   // Some but not all signers have signed
  | 'signed'             // All signers have signed
  | 'declined'           // A signer declined to sign
  | 'expired'            // Contract expired before completion
  | 'cancelled'          // Breeder cancelled the contract
  | 'voided';            // Contract voided after signing

/**
 * Human-readable labels for contract statuses
 */
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Draft',
  pending_upload: 'Pending Upload',
  sent: 'Sent',
  viewed: 'Viewed',
  partially_signed: 'Partially Signed',
  signed: 'Signed',
  declined: 'Declined',
  expired: 'Expired',
  cancelled: 'Cancelled',
  voided: 'Voided',
};

/**
 * Status colors for UI display
 */
export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft: 'gray',
  pending_upload: 'yellow',
  sent: 'blue',
  viewed: 'indigo',
  partially_signed: 'purple',
  signed: 'green',
  declined: 'red',
  expired: 'orange',
  cancelled: 'gray',
  voided: 'red',
};

/**
 * Role a signer plays in a contract
 */
export type SignerRole = 'breeder' | 'buyer' | 'co_owner' | 'guardian' | 'witness';

/**
 * Human-readable labels for signer roles
 */
export const SIGNER_ROLE_LABELS: Record<SignerRole, string> = {
  breeder: 'Breeder',
  buyer: 'Buyer',
  co_owner: 'Co-Owner',
  guardian: 'Guardian',
  witness: 'Witness',
};

/**
 * Status of an individual signer
 */
export type SignerStatus = 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';

/**
 * Human-readable labels for signer statuses
 */
export const SIGNER_STATUS_LABELS: Record<SignerStatus, string> = {
  pending: 'Pending',
  sent: 'Invite Sent',
  viewed: 'Viewed',
  signed: 'Signed',
  declined: 'Declined',
};

/**
 * Individual signer on a contract
 * Stored as subcollection: contracts/{contractId}/signers/{signerId}
 */
export interface ContractSigner {
  id: string;
  /** Role in the contract */
  role: SignerRole;
  /** Full name */
  name: string;
  /** Email address */
  email: string;
  /** Phone number (optional) */
  phone?: string;

  /** SignNow signer ID */
  signNowSignerId?: string;
  /** SignNow invite ID */
  inviteId?: string;

  /** Current status */
  status: SignerStatus;
  /** Order for sequential signing (1-indexed) */
  order: number;

  /** When they viewed the document */
  viewedAt?: string;
  /** When they signed */
  signedAt?: string;
  /** When they declined */
  declinedAt?: string;
  /** Reason for declining */
  declineReason?: string;

  /** How they signed */
  signingMethod?: 'email' | 'embedded' | 'in_person';
  /** Embedded signing URL (temporary) */
  embeddedSigningUrl?: string;
  /** When embedded URL expires */
  embeddedUrlExpiresAt?: string;

  /** IP address when signed (for audit) */
  signedFromIp?: string;
  /** Device info when signed (for audit) */
  signedFromDevice?: string;
}

/**
 * A contract instance sent for signature
 * Stored in contracts/{contractId}
 */
export interface SignNowContract {
  id: string;
  /** Breeder who owns this contract */
  userId: string;

  /** Template used (if any) */
  templateId?: string;
  /** Type of contract */
  templateType: ContractTemplateType;

  /** SignNow document ID */
  signNowDocumentId?: string;
  /** SignNow folder ID (if organized) */
  signNowFolderId?: string;

  /** Contract name/title */
  name: string;
  /** Optional description */
  description?: string;
  /** Current status */
  status: ContractStatus;

  /** Related entities */
  litterId?: string;
  puppyId?: string;
  studJobId?: string;
  dogId?: string;
  customerId?: string;
  waitlistEntryId?: string;

  /** Signers (denormalized for quick access) */
  signers: ContractSigner[];
  /** Signing order */
  signingOrder: 'parallel' | 'sequential';
  /** Current signer index for sequential signing */
  currentSignerIndex?: number;

  /** Original unsigned PDF in Firebase Storage */
  originalPdfUrl?: string;
  /** Signed PDF in Firebase Storage */
  signedPdfUrl?: string;

  /** Merge data used to fill template variables */
  mergeData?: Record<string, string>;

  /** Timestamps */
  createdAt: string;
  sentAt?: string;
  expiresAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  updatedAt: string;

  /** Reminder tracking */
  remindersSent: number;
  lastReminderAt?: string;
}

// ============================================================================
// Audit Event Types
// ============================================================================

/**
 * Types of audit events that can occur on a contract
 */
export type ContractAuditEventType =
  | 'created'
  | 'uploaded_to_signnow'
  | 'invite_sent'
  | 'viewed'
  | 'signed'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'voided'
  | 'reminder_sent'
  | 'completed'
  | 'downloaded'
  | 'resent';

/**
 * Audit event for contract history
 * Stored in contracts/{contractId}/auditEvents/{eventId}
 */
export interface ContractAuditEvent {
  id: string;
  contractId: string;
  eventType: ContractAuditEventType;
  timestamp: string;

  /** Who performed the action */
  actorType: 'breeder' | 'signer' | 'system' | 'webhook';
  actorId?: string;
  actorEmail?: string;
  actorName?: string;

  /** Event description */
  description: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Technical details */
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// Webhook Event Types
// ============================================================================

/**
 * Raw webhook event from SignNow
 * Stored in signNowWebhookEvents/{eventId}
 */
export interface SignNowWebhookEvent {
  id: string;
  eventType: string;
  documentId: string;
  userId?: string;
  timestamp: string;
  rawPayload: Record<string, unknown>;
  processed: boolean;
  processedAt?: string;
  error?: string;
}

// ============================================================================
// Download Queue Types
// ============================================================================

/**
 * Queue item for downloading signed PDFs
 * Stored in signNowDownloadQueue/{queueId}
 */
export interface SignNowDownloadQueueItem {
  id: string;
  contractId: string;
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
  retryCount: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Contract analytics for a breeder
 */
export interface ContractAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year' | 'all';

  /** Counts */
  totalContracts: number;
  contractsSent: number;
  contractsSigned: number;
  contractsDeclined: number;
  contractsExpired: number;

  /** Rates */
  signatureRate: number;
  declineRate: number;
  expirationRate: number;

  /** Timing */
  averageTimeToSign: number;
  averageTimeToView: number;

  /** By type */
  byType: Partial<Record<ContractTemplateType, {
    sent: number;
    signed: number;
    declined: number;
  }>>;

  generatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from uploadContractToSignNow function
 */
export interface UploadContractResponse {
  success: boolean;
  documentId?: string;
  error?: string;
}

/**
 * Response from createSigningInvite function
 */
export interface CreateInviteResponse {
  success: boolean;
  invites?: Array<{
    signerId: string;
    inviteId: string;
    email: string;
  }>;
  error?: string;
}

/**
 * Response from getEmbeddedSigningLink function
 */
export interface EmbeddedSigningLinkResponse {
  success: boolean;
  signingUrl?: string;
  expiresAt?: string;
  error?: string;
}

// ============================================================================
// Merge Variable Definitions
// ============================================================================

/**
 * Standard merge variables available in contracts
 */
export const STANDARD_MERGE_VARIABLES = [
  // Breeder info
  '{{breeder_name}}',
  '{{breeder_email}}',
  '{{breeder_phone}}',
  '{{breeder_address}}',
  '{{kennel_name}}',

  // Buyer info
  '{{buyer_name}}',
  '{{buyer_email}}',
  '{{buyer_phone}}',
  '{{buyer_address}}',

  // Puppy info
  '{{puppy_name}}',
  '{{puppy_call_name}}',
  '{{puppy_breed}}',
  '{{puppy_color}}',
  '{{puppy_sex}}',
  '{{puppy_dob}}',
  '{{puppy_microchip}}',
  '{{puppy_registration}}',

  // Parent info
  '{{sire_name}}',
  '{{sire_registration}}',
  '{{dam_name}}',
  '{{dam_registration}}',

  // Financial
  '{{price}}',
  '{{deposit_amount}}',
  '{{balance_due}}',

  // Dates
  '{{contract_date}}',
  '{{pickup_date}}',
  '{{today_date}}',
] as const;

export type StandardMergeVariable = typeof STANDARD_MERGE_VARIABLES[number];
