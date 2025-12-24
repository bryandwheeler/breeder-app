// Instagram Messaging Integration Types
// Based on Meta Instagram Messaging API

// ============================================================================
// INSTAGRAM ACCOUNT & CONNECTION
// ============================================================================

export interface InstagramAccount {
  id: string; // Our internal ID
  userId: string; // Breeder's user ID

  // Instagram Business Account Details
  instagramBusinessAccountId: string; // From Meta Graph API (IGBA ID)
  instagramUsername: string; // e.g., @expertbreeder
  instagramProfilePicture?: string;
  followersCount?: number;

  // Facebook Page Connection (required for Instagram Messaging API)
  facebookPageId: string; // Connected Facebook Page ID
  facebookPageName?: string;
  facebookPageAccessToken: string; // Long-lived page access token

  // Connection Status
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'expired' | 'error';
  lastTokenRefresh?: string; // ISO timestamp
  tokenExpiresAt?: string; // ISO timestamp

  // Permissions
  grantedPermissions: string[]; // e.g., ['pages_messaging', 'instagram_basic', 'instagram_manage_messages']

  // Webhook Configuration
  webhookSubscribed: boolean;
  webhookFields?: string[]; // e.g., ['messages', 'messaging_postbacks']

  // Settings
  autoReplyEnabled?: boolean;
  autoReplyMessage?: string;
  businessHours?: BusinessHours;

  createdAt: string;
  updatedAt: string;

  // Error tracking
  lastError?: {
    code: string;
    message: string;
    timestamp: string;
  };
}

export interface BusinessHours {
  enabled: boolean;
  timezone: string;
  schedule: {
    [key: string]: { // 'monday', 'tuesday', etc.
      enabled: boolean;
      open: string; // HH:mm format
      close: string;
    };
  };
}

// ============================================================================
// CONVERSATION & MESSAGE DATA MODELS
// ============================================================================

export type ConversationChannel = 'instagram' | 'sms' | 'email' | 'whatsapp' | 'facebook';
export type ConversationStatus = 'open' | 'pending' | 'closed' | 'archived';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';

export interface Conversation {
  id: string; // Our internal conversation ID
  userId: string; // Breeder's user ID

  // Channel Information
  channel: ConversationChannel;
  channelAccountId: string; // Reference to InstagramAccount.id, SMS provider ID, etc.

  // Participant Information
  contactId?: string; // Link to Customer.id if matched
  contactName?: string; // Display name from the platform
  contactUsername?: string; // Instagram username, phone number, email, etc.
  contactProfilePicture?: string;

  // Instagram-specific
  instagramSenderId?: string; // Instagram-scoped user ID (IGSID)

  // Conversation Metadata
  subject?: string; // For email threads
  status: ConversationStatus;
  assignedTo?: string; // User ID of team member assigned to this conversation
  tags?: string[]; // e.g., ['urgent', 'puppy-inquiry', 'follow-up']

  // Message Stats
  messageCount: number;
  unreadCount: number;
  lastMessageAt: string; // ISO timestamp
  lastMessagePreview?: string; // First 100 chars of last message
  lastMessageDirection?: MessageDirection;

  // Instagram 24-hour window tracking
  canReplyUntil?: string; // ISO timestamp - when the 24-hour window expires
  isWithin24HourWindow?: boolean; // Computed field

  // Engagement
  firstMessageAt: string; // When conversation started
  lastBreederReplyAt?: string; // Last time breeder responded
  averageResponseTime?: number; // In minutes

  // Flags
  isSpam?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  hasUnreadMessages?: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string; // Our internal message ID
  conversationId: string; // Reference to Conversation.id
  userId: string; // Breeder's user ID

  // Message Content
  content: string; // Text content
  contentType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'story_mention' | 'story_reply';

  // Direction & Status
  direction: MessageDirection;
  status: MessageStatus;

  // Sender/Recipient
  senderId: string; // Platform-specific ID (IGSID for Instagram)
  senderName?: string;
  recipientId: string;
  recipientName?: string;

  // Attachments
  attachments?: MessageAttachment[];

  // Instagram-specific
  instagramMessageId?: string; // Message ID from Instagram API
  isStoryReply?: boolean;
  isStoryMention?: boolean;
  storyId?: string; // If replying to a story
  storyUrl?: string;

  // Metadata
  platform: ConversationChannel;
  platformAccountId: string; // InstagramAccount.id, etc.

  // Timing
  sentAt: string; // ISO timestamp
  deliveredAt?: string;
  readAt?: string;

  // Error handling
  errorCode?: string;
  errorMessage?: string;
  retryCount?: number;

  // Threading (for email)
  threadId?: string;
  inReplyToId?: string; // ID of message this is replying to

  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string; // URL to the media
  thumbnailUrl?: string;
  mimeType?: string;
  fileSize?: number; // In bytes
  filename?: string;
  width?: number; // For images/videos
  height?: number;
  duration?: number; // For audio/video in seconds
}

// ============================================================================
// CONTACT MATCHING & ENRICHMENT
// ============================================================================

export interface ContactMatchResult {
  matchFound: boolean;
  customerId?: string; // Customer.id if matched
  confidence: 'high' | 'medium' | 'low';
  matchedBy?: 'instagram_username' | 'name' | 'email' | 'phone' | 'manual';
  suggestedMatches?: Array<{
    customerId: string;
    customerName: string;
    matchScore: number; // 0-100
    matchReasons: string[];
  }>;
}

// ============================================================================
// INSTAGRAM API INTEGRATION TYPES
// ============================================================================

export interface InstagramWebhookPayload {
  object: 'instagram';
  entry: Array<{
    id: string; // Instagram Business Account ID
    time: number; // Unix timestamp
    messaging?: InstagramMessagingEvent[];
  }>;
}

export interface InstagramMessagingEvent {
  sender: {
    id: string; // IGSID
  };
  recipient: {
    id: string; // Instagram Business Account ID
  };
  timestamp: number;
  message?: {
    mid: string; // Message ID
    text?: string;
    attachments?: Array<{
      type: 'image' | 'video' | 'audio' | 'file';
      payload: {
        url: string;
      };
    }>;
    is_echo?: boolean; // true if this is an echo of a message the business sent
    reply_to?: {
      mid: string; // Message ID this is replying to
      story?: {
        url: string;
        id: string;
      };
    };
  };
  postback?: {
    mid: string;
    title: string;
    payload: string;
  };
  read?: {
    mid: string; // Message ID that was read
  };
}

// Request/Response types for Meta Graph API
export interface InstagramSendMessageRequest {
  recipient: {
    id: string; // IGSID
  };
  message: {
    text?: string;
    attachment?: {
      type: 'image' | 'video' | 'audio' | 'file';
      payload: {
        url: string;
        is_reusable?: boolean;
      };
    };
  };
}

export interface InstagramSendMessageResponse {
  recipient_id: string;
  message_id: string;
}

export interface InstagramUserProfile {
  id: string; // IGSID
  name?: string;
  username?: string;
  profile_pic?: string;
  follower_count?: number;
}

// ============================================================================
// OAUTH & AUTHENTICATION
// ============================================================================

export interface InstagramOAuthConfig {
  clientId: string; // Meta App ID
  clientSecret: string;
  redirectUri: string;
  scope: string[]; // Required permissions
}

export interface InstagramOAuthTokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in?: number; // Seconds until expiration
}

export interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

// ============================================================================
// UI/UX STATE TYPES
// ============================================================================

export interface InboxFilter {
  channels?: ConversationChannel[];
  status?: ConversationStatus[];
  assignedTo?: string;
  tags?: string[];
  searchQuery?: string;
  hasUnread?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface InboxState {
  conversations: Conversation[];
  selectedConversationId?: string;
  isLoading: boolean;
  filter: InboxFilter;
  sortBy: 'lastMessageAt' | 'createdAt' | 'unreadCount';
  sortOrder: 'asc' | 'desc';
}

export interface MessageComposer {
  conversationId: string;
  content: string;
  attachments: File[];
  isSending: boolean;
  error?: string;
}

// ============================================================================
// TEMPLATE MESSAGES & QUICK REPLIES
// ============================================================================

export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;
  content: string;
  category: 'inquiry_response' | 'follow_up' | 'availability' | 'general' | 'custom';
  tags?: string[];
  useCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuickReply {
  id: string;
  text: string;
  payload?: string; // Optional data to track when clicked
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

export interface MessagingAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;

  // Volume metrics
  totalConversations: number;
  newConversations: number;
  closedConversations: number;

  // Message metrics
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;

  // Channel breakdown
  byChannel: {
    [key in ConversationChannel]?: {
      conversations: number;
      messages: number;
      avgResponseTime: number; // minutes
    };
  };

  // Response metrics
  averageResponseTime: number; // minutes
  firstResponseTime: number; // minutes
  responseRate: number; // percentage of conversations with at least one reply

  // Conversion tracking
  conversationsToCustomers?: number; // Conversations that resulted in creating a Customer record
  conversionRate?: number; // Percentage
}

// ============================================================================
// AUTOMATION & RULES
// ============================================================================

export interface AutomationRule {
  id: string;
  userId: string;
  name: string;
  isEnabled: boolean;

  // Trigger conditions
  trigger: {
    event: 'new_conversation' | 'new_message' | 'keyword_detected' | 'outside_business_hours';
    channels?: ConversationChannel[];
    keywords?: string[];
  };

  // Actions to take
  actions: Array<{
    type: 'send_message' | 'assign_to' | 'add_tag' | 'mark_as_spam' | 'create_customer';
    config: {
      message?: string;
      templateId?: string;
      assignTo?: string;
      tags?: string[];
    };
  }>;

  createdAt: string;
  updatedAt: string;
}
