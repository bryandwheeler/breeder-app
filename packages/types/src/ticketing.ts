// Ticketing System Types
// Support ticket management for breeders to submit issues/feature requests

import { UserRole, UserType } from './admin';

// ============================================================================
// Ticket Enums and Types
// ============================================================================

// Ticket priority levels
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

// Ticket status lifecycle
export type TicketStatus =
  | 'open'                  // New ticket, not yet reviewed
  | 'in_progress'           // Support is working on it
  | 'waiting_on_customer'   // Waiting for customer response
  | 'waiting_on_support'    // Customer responded, waiting for support
  | 'resolved'              // Issue resolved, waiting for confirmation
  | 'closed';               // Ticket closed

// Ticket categories for organization
export type TicketCategory =
  | 'bug_report'
  | 'feature_request'
  | 'account_issue'
  | 'billing'
  | 'technical_support'
  | 'general_inquiry'
  | 'other';

// Human-readable labels for categories
export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  account_issue: 'Account Issue',
  billing: 'Billing Question',
  technical_support: 'Technical Support',
  general_inquiry: 'General Inquiry',
  other: 'Other',
};

// Human-readable labels for priorities
export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Human-readable labels for statuses
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_on_customer: 'Waiting on Customer',
  waiting_on_support: 'Waiting on Support',
  resolved: 'Resolved',
  closed: 'Closed',
};

// ============================================================================
// Ticket Interfaces
// ============================================================================

// Ticket attachment (screenshots, files, etc.)
export interface TicketAttachment {
  id: string;
  name: string;
  url: string;
  type: string; // MIME type
  size: number; // bytes
  uploadedAt: string;
  uploadedBy: string;
}

// Individual message within a ticket
export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: UserRole;
  content: string;
  attachments?: TicketAttachment[];
  isInternal: boolean; // Internal notes visible only to support/admin
  createdAt: string;
  editedAt?: string;
}

// Main ticket entity
export interface Ticket {
  id: string;
  ticketNumber: string; // Human-readable (e.g., "TKT-2024-00001")

  // Submitter info
  submitterId: string;
  submitterEmail: string;
  submitterName: string;
  submitterType: UserType;

  // Ticket details
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  // Assignment
  assignedToId?: string;
  assignedToName?: string;
  assignedToEmail?: string;

  // Tags for filtering/organization
  tags?: string[];

  // Related entities (optional links to dogs, litters, etc.)
  relatedDogId?: string;
  relatedDogName?: string;
  relatedLitterId?: string;
  relatedPuppyId?: string;

  // Message tracking
  messageCount: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageSenderId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string; // When support first responded
  resolvedAt?: string;
  closedAt?: string;

  // SLA tracking (optional)
  slaDeadline?: string;
  slaBreach?: boolean;
}

// ============================================================================
// Ticket Filters and Stats
// ============================================================================

// Ticket search/filter options
export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedToId?: string;
  submitterId?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

// Ticket statistics for dashboard
export interface TicketStats {
  totalOpen: number;
  totalInProgress: number;
  totalWaitingOnCustomer: number;
  totalWaitingOnSupport: number;
  totalResolved: number;
  totalClosed: number;
  avgFirstResponseTime: number; // minutes
  avgResolutionTime: number; // minutes
  ticketsByCategory: Record<TicketCategory, number>;
  ticketsByPriority: Record<TicketPriority, number>;
}

// ============================================================================
// Ticket Creation/Update DTOs
// ============================================================================

// Data for creating a new ticket
export interface CreateTicketData {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority; // Defaults to 'medium'
  attachments?: TicketAttachment[];
  relatedDogId?: string;
  relatedLitterId?: string;
}

// Data for updating a ticket (support/admin)
export interface UpdateTicketData {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  assignedToName?: string;
  assignedToEmail?: string;
  tags?: string[];
}

// Data for adding a message to a ticket
export interface CreateTicketMessageData {
  content: string;
  attachments?: TicketAttachment[];
  isInternal?: boolean; // Only support/admin can create internal notes
}

// ============================================================================
// Ticket Notification Settings
// ============================================================================

export interface TicketNotificationSettings {
  emailOnNewTicket: boolean;
  emailOnTicketUpdate: boolean;
  emailOnTicketAssigned: boolean;
  emailOnTicketResolved: boolean;
  inAppNotifications: boolean;
}

export const DEFAULT_TICKET_NOTIFICATION_SETTINGS: TicketNotificationSettings = {
  emailOnNewTicket: true,
  emailOnTicketUpdate: true,
  emailOnTicketAssigned: true,
  emailOnTicketResolved: true,
  inAppNotifications: true,
};

// ============================================================================
// Helper Functions
// ============================================================================

// Generate ticket number
export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `TKT-${year}-${random}`;
}

// Check if ticket is open (not resolved or closed)
export function isTicketOpen(status: TicketStatus): boolean {
  return !['resolved', 'closed'].includes(status);
}

// Get status color for UI
export function getStatusColor(status: TicketStatus): string {
  switch (status) {
    case 'open':
      return 'blue';
    case 'in_progress':
      return 'yellow';
    case 'waiting_on_customer':
      return 'orange';
    case 'waiting_on_support':
      return 'purple';
    case 'resolved':
      return 'green';
    case 'closed':
      return 'gray';
    default:
      return 'gray';
  }
}

// Get priority color for UI
export function getPriorityColor(priority: TicketPriority): string {
  switch (priority) {
    case 'low':
      return 'gray';
    case 'medium':
      return 'blue';
    case 'high':
      return 'orange';
    case 'urgent':
      return 'red';
    default:
      return 'gray';
  }
}
