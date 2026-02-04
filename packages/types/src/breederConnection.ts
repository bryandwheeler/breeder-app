// Breeder Social Connection Types
// Types for breeder friendships, messaging, and conversations

// Friendship status between breeders
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

// Friend-style connection between breeders (separate from dog data sharing)
export interface BreederFriendship {
  id: string;
  requesterId: string;           // User who sent request
  requesterKennelName: string;
  requesterDisplayName: string;
  recipientId: string;           // User who received request
  recipientKennelName: string;
  recipientDisplayName: string;
  status: FriendshipStatus;
  message?: string;              // Optional intro message
  createdAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  blockedAt?: string;
}

// Direct message between connected breeders (friends only)
// Messaging requires accepted friendship - enforced at store level
export interface BreederMessage {
  id: string;
  conversationId: string;        // Composite of sorted user IDs
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

// Conversation metadata
export interface BreederConversation {
  id: string;                    // Composite of sorted user IDs
  participants: string[];        // [userId1, userId2]
  participantNames: Record<string, string>;
  participantKennelNames?: Record<string, string>;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageSenderId: string;
  unreadCount: Record<string, number>; // Per participant
  createdAt: string;
}

// Breeder profile for search results
export interface BreederSearchResult {
  id: string;
  displayName: string;
  kennelName: string;
  location?: string;
  breed?: string;
  photoURL?: string;
  mutualFriendsCount?: number;
  friendshipStatus?: FriendshipStatus | 'none' | 'self';
}

// Create friendship request payload
export interface CreateFriendshipRequest {
  recipientId: string;
  message?: string;
}

// Send message payload
export interface SendMessageRequest {
  recipientId: string;
  content: string;
}
