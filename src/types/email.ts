// Email integration types

export interface EmailIntegration {
  id: string;
  userId: string;
  provider: 'gmail' | 'outlook';
  email: string;

  // User's OAuth App Credentials (per-user setup)
  clientId: string; // User's own OAuth client ID
  clientSecret: string; // User's own OAuth client secret (encrypted in production)

  // OAuth Tokens
  accessToken?: string; // Encrypted - stored securely
  refreshToken?: string; // Encrypted - stored securely
  tokenExpiry?: string;

  // Integration Status
  isActive: boolean;
  lastSyncedAt?: string;
  syncEnabled: boolean;
  autoLinkCustomers: boolean; // Auto-link emails to customer records

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface OAuthCredentials {
  provider: 'gmail' | 'outlook';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface EmailSyncSettings {
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  syncFrom?: string; // Date to start syncing from
  folders?: string[]; // Specific folders to sync (inbox, sent, etc)
  excludeSpam: boolean;
  maxEmailsPerSync: number;
}

export interface EmailMessage {
  id: string;
  messageId: string; // External message ID
  threadId?: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  date: string;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  labels?: string[];
  customerId?: string; // Linked customer
  interactionId?: string; // Linked interaction record
  provider: 'gmail' | 'outlook';
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  downloadUrl?: string;
}

export interface EmailDraft {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: File[];
  customerId?: string;
  inReplyTo?: string; // Message ID being replied to
  threadId?: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  messages: EmailMessage[];
  participants: EmailAddress[];
  lastMessageDate: string;
  messageCount: number;
  isRead: boolean;
  customerId?: string;
}
