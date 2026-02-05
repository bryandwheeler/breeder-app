// Staff/Employee Management Types
// Enables breeders to add employees to their kennel with granular permissions

// =============================================================================
// Staff Roles & Status
// =============================================================================

/**
 * Preset roles for quick permission assignment
 * - full_access: Everything except billing
 * - manager: Create/edit most things, no delete or settings
 * - assistant: Edit existing records, complete tasks, upload photos
 * - viewer: Read-only access
 * - custom: Pick individual permissions
 */
export type StaffRole = 'full_access' | 'manager' | 'assistant' | 'viewer' | 'custom';

/**
 * Invitation/membership status
 */
export type StaffInvitationStatus =
  | 'pending'   // Invitation sent, awaiting response
  | 'accepted'  // Staff accepted and has access
  | 'declined'  // Staff declined the invitation
  | 'revoked'   // Breeder revoked access
  | 'expired';  // Invitation expired (7 days default)

// =============================================================================
// Granular Permissions
// =============================================================================

/**
 * Fine-grained permissions for staff members
 * Breeders can start with a preset role and customize individual permissions
 */
export interface StaffPermissions {
  // Dogs
  canViewDogs: boolean;
  canCreateDogs: boolean;
  canEditDogs: boolean;
  canDeleteDogs: boolean;

  // Litters
  canViewLitters: boolean;
  canCreateLitters: boolean;
  canEditLitters: boolean;
  canDeleteLitters: boolean;
  canManagePuppies: boolean;

  // Health Records
  canViewHealthRecords: boolean;
  canAddHealthRecords: boolean;
  canEditHealthRecords: boolean;
  canDeleteHealthRecords: boolean;

  // Photos
  canUploadPhotos: boolean;
  canDeletePhotos: boolean;

  // Tasks
  canViewTasks: boolean;
  canManageTasks: boolean;
  canCompleteTasks: boolean;

  // Customers/CRM
  canViewCustomers: boolean;
  canCreateCustomers: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;

  // Waitlist & Inquiries
  canViewWaitlist: boolean;
  canManageWaitlist: boolean;
  canViewInquiries: boolean;
  canManageInquiries: boolean;

  // Stud Jobs
  canViewStudJobs: boolean;
  canManageStudJobs: boolean;

  // Settings (high privilege - off by default)
  canAccessSettings: boolean;
  canEditProfile: boolean;
  canManageBilling: boolean;

  // Reports & Data
  canViewReports: boolean;
  canExportData: boolean;

  // Contracts
  canViewContracts: boolean;
  canCreateContracts: boolean;
  canSendContracts: boolean;

  // Staff Management (only for full_access role)
  canManageStaff: boolean;
}

// =============================================================================
// Staff Member Record
// =============================================================================

/**
 * Links a user account to a breeder as a staff member
 * Document ID format: `{staffUserId}_{breederId}` for easy lookups
 */
export interface StaffMember {
  id: string;
  breederId: string;           // The breeder (employer) user ID
  staffUserId: string;         // The staff member's Firebase Auth UID
  staffEmail: string;          // Email used for invitation
  staffDisplayName?: string;   // Staff member's display name

  // Role and Permissions
  role: StaffRole;
  permissions: StaffPermissions;
  status: StaffInvitationStatus;

  // Optional metadata
  title?: string;              // e.g., "Kennel Manager", "Assistant"
  notes?: string;              // Internal notes from breeder

  // Invitation tracking
  invitedAt: string;           // ISO timestamp
  invitedBy: string;           // User ID who sent invitation
  acceptedAt?: string;         // When staff accepted
  revokedAt?: string;          // When access was revoked
  revokedBy?: string;          // Who revoked
  revokedReason?: string;      // Why access was revoked

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;       // Last time staff accessed this kennel
}

// =============================================================================
// Staff Invitation
// =============================================================================

/**
 * Invitation sent to potential staff member
 * Used before they accept and become a StaffMember
 */
export interface StaffInvitation {
  id: string;
  breederId: string;           // Breeder sending the invitation
  breederName: string;         // For display in invitation email/page
  kennelName?: string;         // For display
  email: string;               // Email to send invitation to
  role: StaffRole;
  permissions: StaffPermissions;
  inviteCode: string;          // Unique code for accepting (UUID v4)
  status: StaffInvitationStatus;
  expiresAt: string;           // Invitation expiry (7 days default)
  createdAt: string;
  acceptedAt?: string;         // When accepted
  staffUserId?: string;        // Filled when accepted
}

// =============================================================================
// Staff Audit Log
// =============================================================================

/**
 * Audit actions that can be logged
 */
export type StaffAuditAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'upload'
  | 'download'
  | 'export'
  | 'complete_task'
  | 'login'
  | 'logout'
  | 'switch_kennel';

/**
 * Target types for audit logging
 */
export type StaffAuditTargetType =
  | 'dog'
  | 'litter'
  | 'puppy'
  | 'customer'
  | 'task'
  | 'health_record'
  | 'photo'
  | 'contract'
  | 'waitlist'
  | 'inquiry'
  | 'stud_job'
  | 'settings'
  | 'other';

/**
 * Audit log entry for staff actions
 * Used to track what staff members do for accountability
 */
export interface StaffAuditLog {
  id: string;
  breederId: string;           // Which kennel this action was in
  staffUserId: string;         // Who performed the action
  staffDisplayName: string;    // Name at time of action
  action: StaffAuditAction;
  targetType: StaffAuditTargetType;
  targetId?: string;           // ID of the affected record
  targetName?: string;         // Name/description of affected record
  details?: Record<string, unknown>; // Additional context
  ipAddress?: string;          // For security auditing
  timestamp: string;           // ISO timestamp
}

// =============================================================================
// Kennel Context (for multi-kennel staff)
// =============================================================================

/**
 * Represents a staff member's access to a specific kennel
 * Used in the kennel switcher and context provider
 */
export interface StaffKennelContext {
  breederId: string;
  breederName: string;
  kennelName?: string;
  role: StaffRole;
  permissions: StaffPermissions;
  lastActiveAt?: string;
}

// =============================================================================
// Default Permission Presets
// =============================================================================

/**
 * Default permissions for each role preset
 * Breeders can customize these after selecting a preset
 */
export const DEFAULT_STAFF_PERMISSIONS: Record<StaffRole, StaffPermissions> = {
  full_access: {
    // Dogs - full access
    canViewDogs: true,
    canCreateDogs: true,
    canEditDogs: true,
    canDeleteDogs: true,
    // Litters - full access
    canViewLitters: true,
    canCreateLitters: true,
    canEditLitters: true,
    canDeleteLitters: true,
    canManagePuppies: true,
    // Health Records - full access
    canViewHealthRecords: true,
    canAddHealthRecords: true,
    canEditHealthRecords: true,
    canDeleteHealthRecords: true,
    // Photos - full access
    canUploadPhotos: true,
    canDeletePhotos: true,
    // Tasks - full access
    canViewTasks: true,
    canManageTasks: true,
    canCompleteTasks: true,
    // Customers - full access
    canViewCustomers: true,
    canCreateCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    // Waitlist & Inquiries - full access
    canViewWaitlist: true,
    canManageWaitlist: true,
    canViewInquiries: true,
    canManageInquiries: true,
    // Stud Jobs - full access
    canViewStudJobs: true,
    canManageStudJobs: true,
    // Settings - limited (no billing)
    canAccessSettings: true,
    canEditProfile: true,
    canManageBilling: false, // Never auto-granted
    // Reports - full access
    canViewReports: true,
    canExportData: true,
    // Contracts - full access
    canViewContracts: true,
    canCreateContracts: true,
    canSendContracts: true,
    // Staff Management - yes
    canManageStaff: true,
  },

  manager: {
    // Dogs - create/edit, no delete
    canViewDogs: true,
    canCreateDogs: true,
    canEditDogs: true,
    canDeleteDogs: false,
    // Litters - create/edit, no delete
    canViewLitters: true,
    canCreateLitters: true,
    canEditLitters: true,
    canDeleteLitters: false,
    canManagePuppies: true,
    // Health Records - create/edit, no delete
    canViewHealthRecords: true,
    canAddHealthRecords: true,
    canEditHealthRecords: true,
    canDeleteHealthRecords: false,
    // Photos - upload only
    canUploadPhotos: true,
    canDeletePhotos: false,
    // Tasks - full access
    canViewTasks: true,
    canManageTasks: true,
    canCompleteTasks: true,
    // Customers - create/edit, no delete
    canViewCustomers: true,
    canCreateCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: false,
    // Waitlist & Inquiries - full access
    canViewWaitlist: true,
    canManageWaitlist: true,
    canViewInquiries: true,
    canManageInquiries: true,
    // Stud Jobs - full access
    canViewStudJobs: true,
    canManageStudJobs: true,
    // Settings - no access
    canAccessSettings: false,
    canEditProfile: false,
    canManageBilling: false,
    // Reports - view only
    canViewReports: true,
    canExportData: false,
    // Contracts - create/send
    canViewContracts: true,
    canCreateContracts: true,
    canSendContracts: true,
    // Staff Management - no
    canManageStaff: false,
  },

  assistant: {
    // Dogs - view/edit only
    canViewDogs: true,
    canCreateDogs: false,
    canEditDogs: true,
    canDeleteDogs: false,
    // Litters - view/edit only
    canViewLitters: true,
    canCreateLitters: false,
    canEditLitters: true,
    canDeleteLitters: false,
    canManagePuppies: true,
    // Health Records - view/add only
    canViewHealthRecords: true,
    canAddHealthRecords: true,
    canEditHealthRecords: true,
    canDeleteHealthRecords: false,
    // Photos - upload only
    canUploadPhotos: true,
    canDeletePhotos: false,
    // Tasks - complete only
    canViewTasks: true,
    canManageTasks: false,
    canCompleteTasks: true,
    // Customers - view only
    canViewCustomers: true,
    canCreateCustomers: false,
    canEditCustomers: false,
    canDeleteCustomers: false,
    // Waitlist & Inquiries - view only
    canViewWaitlist: true,
    canManageWaitlist: false,
    canViewInquiries: true,
    canManageInquiries: false,
    // Stud Jobs - view only
    canViewStudJobs: true,
    canManageStudJobs: false,
    // Settings - no access
    canAccessSettings: false,
    canEditProfile: false,
    canManageBilling: false,
    // Reports - no access
    canViewReports: false,
    canExportData: false,
    // Contracts - view only
    canViewContracts: true,
    canCreateContracts: false,
    canSendContracts: false,
    // Staff Management - no
    canManageStaff: false,
  },

  viewer: {
    // Dogs - view only
    canViewDogs: true,
    canCreateDogs: false,
    canEditDogs: false,
    canDeleteDogs: false,
    // Litters - view only
    canViewLitters: true,
    canCreateLitters: false,
    canEditLitters: false,
    canDeleteLitters: false,
    canManagePuppies: false,
    // Health Records - view only
    canViewHealthRecords: true,
    canAddHealthRecords: false,
    canEditHealthRecords: false,
    canDeleteHealthRecords: false,
    // Photos - none
    canUploadPhotos: false,
    canDeletePhotos: false,
    // Tasks - view only
    canViewTasks: true,
    canManageTasks: false,
    canCompleteTasks: false,
    // Customers - view only
    canViewCustomers: true,
    canCreateCustomers: false,
    canEditCustomers: false,
    canDeleteCustomers: false,
    // Waitlist & Inquiries - view only
    canViewWaitlist: true,
    canManageWaitlist: false,
    canViewInquiries: true,
    canManageInquiries: false,
    // Stud Jobs - view only
    canViewStudJobs: true,
    canManageStudJobs: false,
    // Settings - no access
    canAccessSettings: false,
    canEditProfile: false,
    canManageBilling: false,
    // Reports - no access
    canViewReports: false,
    canExportData: false,
    // Contracts - view only
    canViewContracts: true,
    canCreateContracts: false,
    canSendContracts: false,
    // Staff Management - no
    canManageStaff: false,
  },

  custom: {
    // All false by default - breeder picks what to enable
    canViewDogs: false,
    canCreateDogs: false,
    canEditDogs: false,
    canDeleteDogs: false,
    canViewLitters: false,
    canCreateLitters: false,
    canEditLitters: false,
    canDeleteLitters: false,
    canManagePuppies: false,
    canViewHealthRecords: false,
    canAddHealthRecords: false,
    canEditHealthRecords: false,
    canDeleteHealthRecords: false,
    canUploadPhotos: false,
    canDeletePhotos: false,
    canViewTasks: false,
    canManageTasks: false,
    canCompleteTasks: false,
    canViewCustomers: false,
    canCreateCustomers: false,
    canEditCustomers: false,
    canDeleteCustomers: false,
    canViewWaitlist: false,
    canManageWaitlist: false,
    canViewInquiries: false,
    canManageInquiries: false,
    canViewStudJobs: false,
    canManageStudJobs: false,
    canAccessSettings: false,
    canEditProfile: false,
    canManageBilling: false,
    canViewReports: false,
    canExportData: false,
    canViewContracts: false,
    canCreateContracts: false,
    canSendContracts: false,
    canManageStaff: false,
  },
};

// =============================================================================
// Labels and Display Helpers
// =============================================================================

/**
 * Human-readable labels for staff roles
 */
export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  full_access: 'Full Access',
  manager: 'Manager',
  assistant: 'Assistant',
  viewer: 'Viewer',
  custom: 'Custom',
};

/**
 * Descriptions for each role
 */
export const STAFF_ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  full_access: 'Full access to all features except billing. Can manage other staff members.',
  manager: 'Can create and edit records, manage tasks and customers. Cannot delete or access settings.',
  assistant: 'Can edit existing records, complete tasks, and upload photos. Limited to day-to-day operations.',
  viewer: 'Read-only access to all data. Cannot make any changes.',
  custom: 'Custom permissions. Select individual permissions below.',
};

/**
 * Labels for invitation status
 */
export const STAFF_STATUS_LABELS: Record<StaffInvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Active',
  declined: 'Declined',
  revoked: 'Revoked',
  expired: 'Expired',
};

/**
 * Permission category groupings for UI display
 */
export const STAFF_PERMISSION_CATEGORIES = {
  dogs: {
    label: 'Dogs',
    permissions: ['canViewDogs', 'canCreateDogs', 'canEditDogs', 'canDeleteDogs'] as const,
  },
  litters: {
    label: 'Litters & Puppies',
    permissions: ['canViewLitters', 'canCreateLitters', 'canEditLitters', 'canDeleteLitters', 'canManagePuppies'] as const,
  },
  health: {
    label: 'Health Records',
    permissions: ['canViewHealthRecords', 'canAddHealthRecords', 'canEditHealthRecords', 'canDeleteHealthRecords'] as const,
  },
  photos: {
    label: 'Photos',
    permissions: ['canUploadPhotos', 'canDeletePhotos'] as const,
  },
  tasks: {
    label: 'Tasks',
    permissions: ['canViewTasks', 'canManageTasks', 'canCompleteTasks'] as const,
  },
  customers: {
    label: 'Customers',
    permissions: ['canViewCustomers', 'canCreateCustomers', 'canEditCustomers', 'canDeleteCustomers'] as const,
  },
  waitlist: {
    label: 'Waitlist & Inquiries',
    permissions: ['canViewWaitlist', 'canManageWaitlist', 'canViewInquiries', 'canManageInquiries'] as const,
  },
  studJobs: {
    label: 'Stud Jobs',
    permissions: ['canViewStudJobs', 'canManageStudJobs'] as const,
  },
  contracts: {
    label: 'Contracts',
    permissions: ['canViewContracts', 'canCreateContracts', 'canSendContracts'] as const,
  },
  reports: {
    label: 'Reports & Data',
    permissions: ['canViewReports', 'canExportData'] as const,
  },
  settings: {
    label: 'Settings & Administration',
    permissions: ['canAccessSettings', 'canEditProfile', 'canManageBilling', 'canManageStaff'] as const,
  },
};

/**
 * Human-readable labels for individual permissions
 */
export const STAFF_PERMISSION_LABELS: Record<keyof StaffPermissions, string> = {
  canViewDogs: 'View dogs',
  canCreateDogs: 'Add new dogs',
  canEditDogs: 'Edit dog profiles',
  canDeleteDogs: 'Delete dogs',
  canViewLitters: 'View litters',
  canCreateLitters: 'Create litters',
  canEditLitters: 'Edit litters',
  canDeleteLitters: 'Delete litters',
  canManagePuppies: 'Manage puppies',
  canViewHealthRecords: 'View health records',
  canAddHealthRecords: 'Add health records',
  canEditHealthRecords: 'Edit health records',
  canDeleteHealthRecords: 'Delete health records',
  canUploadPhotos: 'Upload photos',
  canDeletePhotos: 'Delete photos',
  canViewTasks: 'View tasks',
  canManageTasks: 'Create/edit tasks',
  canCompleteTasks: 'Complete tasks',
  canViewCustomers: 'View customers',
  canCreateCustomers: 'Add customers',
  canEditCustomers: 'Edit customers',
  canDeleteCustomers: 'Delete customers',
  canViewWaitlist: 'View waitlist',
  canManageWaitlist: 'Manage waitlist',
  canViewInquiries: 'View inquiries',
  canManageInquiries: 'Manage inquiries',
  canViewStudJobs: 'View stud jobs',
  canManageStudJobs: 'Manage stud jobs',
  canAccessSettings: 'Access settings',
  canEditProfile: 'Edit breeder profile',
  canManageBilling: 'Manage billing',
  canViewReports: 'View reports',
  canExportData: 'Export data',
  canViewContracts: 'View contracts',
  canCreateContracts: 'Create contracts',
  canSendContracts: 'Send contracts',
  canManageStaff: 'Manage staff members',
};
