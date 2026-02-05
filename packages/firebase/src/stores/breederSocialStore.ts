// Breeder Social Store - Zustand store for managing breeder friendships and messaging
import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
  orderBy,
  limit,
  getDoc,
  or,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import {
  BreederFriendship,
  BreederMessage,
  BreederConversation,
  BreederSearchResult,
  FriendshipStatus,
} from '@breeder/types';

// Helper to generate conversation ID from two user IDs
const getConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

interface BreederSocialStore {
  // State
  friendships: BreederFriendship[];
  pendingRequests: BreederFriendship[];
  sentRequests: BreederFriendship[];
  blockedUsers: string[];
  conversations: BreederConversation[];
  currentConversation: BreederMessage[];
  currentConversationId: string | null;
  loading: boolean;
  error: string | null;
  totalUnreadMessages: number;

  // Friendship Actions
  sendFriendRequest: (
    recipientId: string,
    recipientKennelName: string,
    recipientDisplayName: string,
    message?: string
  ) => Promise<string>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  declineFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;

  // Messaging Actions (friends only)
  sendMessage: (recipientId: string, content: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  setCurrentConversation: (conversationId: string | null) => void;

  // Subscriptions
  subscribeToFriendships: (userId: string) => () => void;
  subscribeToConversations: (userId: string) => () => void;
  subscribeToMessages: (conversationId: string) => () => void;

  // Search
  searchBreeders: (queryStr: string) => Promise<BreederSearchResult[]>;

  // Helpers
  getFriendsList: () => BreederFriendship[];
  isFriend: (userId: string) => boolean;
  getFriendship: (userId: string) => BreederFriendship | undefined;

  // Utility
  clearError: () => void;
  reset: () => void;
}

export const useBreederSocialStore = create<BreederSocialStore>((set, get) => ({
  // Initial State
  friendships: [],
  pendingRequests: [],
  sentRequests: [],
  blockedUsers: [],
  conversations: [],
  currentConversation: [],
  currentConversationId: null,
  loading: false,
  error: null,
  totalUnreadMessages: 0,

  // ============================================================================
  // Friendship Actions
  // ============================================================================

  sendFriendRequest: async (
    recipientId,
    recipientKennelName,
    recipientDisplayName,
    message
  ) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to send friend requests');

    set({ loading: true, error: null });
    try {
      // Get requester's profile info
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      const friendshipData: Omit<BreederFriendship, 'id'> = {
        requesterId: user.uid,
        requesterKennelName: userData?.kennelName || 'Unknown Kennel',
        requesterDisplayName: userData?.displayName || user.email || 'Unknown',
        recipientId,
        recipientKennelName,
        recipientDisplayName,
        status: 'pending',
        // Only include message field if provided (Firestore rejects undefined values)
        ...(message ? { message } : {}),
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, 'breederFriendships'),
        friendshipData
      );

      // Create in-app notification for recipient
      await addDoc(collection(db, 'notifications'), {
        userId: recipientId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${friendshipData.requesterDisplayName} from ${friendshipData.requesterKennelName} wants to connect with you`,
        read: false,
        actionUrl: '/community',
        metadata: {
          friendshipId: docRef.id,
          requesterId: user.uid,
          requesterName: friendshipData.requesterDisplayName,
          requesterKennel: friendshipData.requesterKennelName,
        },
        createdAt: new Date().toISOString(),
      });

      set({ loading: false });
      return docRef.id;
    } catch (error) {
      console.error('[breederSocialStore] sendFriendRequest error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send friend request';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  acceptFriendRequest: async (friendshipId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to accept friend requests');

    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'breederFriendships', friendshipId);

      // Get the friendship to find the requester
      const friendshipDoc = await getDoc(docRef);
      const friendship = friendshipDoc.data() as BreederFriendship;

      await updateDoc(docRef, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
      });

      // Create in-app notification for the requester
      if (friendship) {
        // Get accepter's info
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        const accepterName = userData?.displayName || user.email || 'A breeder';
        const accepterKennel = userData?.kennelName || '';

        await addDoc(collection(db, 'notifications'), {
          userId: friendship.requesterId,
          type: 'friend_accepted',
          title: 'Friend Request Accepted',
          message: `${accepterName}${accepterKennel ? ` from ${accepterKennel}` : ''} accepted your friend request`,
          read: false,
          actionUrl: '/community',
          metadata: {
            friendshipId,
            accepterId: user.uid,
            accepterName,
            accepterKennel,
          },
          createdAt: new Date().toISOString(),
        });
      }

      set({ loading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to accept friend request';
      set({ error: message, loading: false });
      throw error;
    }
  },

  declineFriendRequest: async (friendshipId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to decline friend requests');

    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'breederFriendships', friendshipId);
      await updateDoc(docRef, {
        status: 'declined',
        declinedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to decline friend request';
      set({ error: message, loading: false });
      throw error;
    }
  },

  removeFriend: async (friendshipId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to remove friends');

    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'breederFriendships', friendshipId);
      await deleteDoc(docRef);
      set({ loading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to remove friend';
      set({ error: message, loading: false });
      throw error;
    }
  },

  blockUser: async (userId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to block users');

    set({ loading: true, error: null });
    try {
      // Check if there's an existing friendship
      const friendshipsRef = collection(db, 'breederFriendships');
      const q = query(
        friendshipsRef,
        or(
          where('requesterId', '==', user.uid),
          where('recipientId', '==', user.uid)
        )
      );
      const snapshot = await getDocs(q);

      // Find the friendship with this user
      const friendship = snapshot.docs.find(
        (d) =>
          (d.data().requesterId === userId || d.data().recipientId === userId)
      );

      if (friendship) {
        await updateDoc(friendship.ref, {
          status: 'blocked',
          blockedAt: new Date().toISOString(),
          blockedBy: user.uid,
        });
      } else {
        // Create a new blocked entry
        await addDoc(friendshipsRef, {
          requesterId: user.uid,
          recipientId: userId,
          status: 'blocked',
          blockedAt: new Date().toISOString(),
          blockedBy: user.uid,
          createdAt: new Date().toISOString(),
        });
      }
      set({ loading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to block user';
      set({ error: message, loading: false });
      throw error;
    }
  },

  unblockUser: async (userId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to unblock users');

    set({ loading: true, error: null });
    try {
      const friendshipsRef = collection(db, 'breederFriendships');
      const q = query(
        friendshipsRef,
        or(
          where('requesterId', '==', user.uid),
          where('recipientId', '==', user.uid)
        )
      );
      const snapshot = await getDocs(q);

      const blockedEntry = snapshot.docs.find(
        (d) =>
          d.data().status === 'blocked' &&
          (d.data().requesterId === userId || d.data().recipientId === userId)
      );

      if (blockedEntry) {
        await deleteDoc(blockedEntry.ref);
      }
      set({ loading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to unblock user';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // Messaging Actions
  // ============================================================================

  sendMessage: async (recipientId, content) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to send messages');

    // Verify friendship
    const isFriend = get().isFriend(recipientId);
    if (!isFriend) {
      throw new Error('You can only message friends. Send a friend request first.');
    }

    set({ loading: true, error: null });
    try {
      const conversationId = getConversationId(user.uid, recipientId);

      // Get sender name
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const senderName = userData?.displayName || user.email || 'Unknown';

      // Create the message
      const messageData: Omit<BreederMessage, 'id'> = {
        conversationId,
        senderId: user.uid,
        senderName,
        recipientId,
        content,
        read: false,
        createdAt: new Date().toISOString(),
      };

      const batch = writeBatch(db);

      // Add message to subcollection
      const messagesRef = collection(
        db,
        'breederConversations',
        conversationId,
        'messages'
      );
      const messageDocRef = doc(messagesRef);
      batch.set(messageDocRef, messageData);

      // Update or create conversation metadata
      const conversationRef = doc(db, 'breederConversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (conversationDoc.exists()) {
        // Update existing conversation
        const existingData = conversationDoc.data() as BreederConversation;
        const newUnreadCount = { ...existingData.unreadCount };
        newUnreadCount[recipientId] = (newUnreadCount[recipientId] || 0) + 1;

        batch.update(conversationRef, {
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview:
            content.length > 50 ? content.substring(0, 50) + '...' : content,
          lastMessageSenderId: user.uid,
          unreadCount: newUnreadCount,
        });
      } else {
        // Create new conversation
        const recipientDoc = await getDoc(doc(db, 'users', recipientId));
        const recipientData = recipientDoc.data();

        const conversationData: BreederConversation = {
          id: conversationId,
          participants: [user.uid, recipientId],
          participantNames: {
            [user.uid]: senderName,
            [recipientId]:
              recipientData?.displayName || recipientData?.email || 'Unknown',
          },
          participantKennelNames: {
            [user.uid]: userData?.kennelName || '',
            [recipientId]: recipientData?.kennelName || '',
          },
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview:
            content.length > 50 ? content.substring(0, 50) + '...' : content,
          lastMessageSenderId: user.uid,
          unreadCount: {
            [user.uid]: 0,
            [recipientId]: 1,
          },
          createdAt: new Date().toISOString(),
        };
        batch.set(conversationRef, conversationData);
      }

      await batch.commit();
      set({ loading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send message';
      set({ error: message, loading: false });
      throw error;
    }
  },

  markConversationRead: async (conversationId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    try {
      const conversationRef = doc(db, 'breederConversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (conversationDoc.exists()) {
        const data = conversationDoc.data() as BreederConversation;
        const newUnreadCount = { ...data.unreadCount };
        newUnreadCount[user.uid] = 0;

        await updateDoc(conversationRef, {
          unreadCount: newUnreadCount,
        });
      }

      // Mark individual messages as read
      const messagesRef = collection(
        db,
        'breederConversations',
        conversationId,
        'messages'
      );
      const q = query(
        messagesRef,
        where('recipientId', '==', user.uid),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  },

  setCurrentConversation: (conversationId) => {
    set({ currentConversationId: conversationId, currentConversation: [] });
  },

  // ============================================================================
  // Subscriptions
  // ============================================================================

  subscribeToFriendships: (userId) => {
    // Query for friendships where user is requester or recipient
    const friendshipsRef = collection(db, 'breederFriendships');

    // Subscribe to requests where user is the requester
    const requesterQuery = query(
      friendshipsRef,
      where('requesterId', '==', userId)
    );

    // Subscribe to requests where user is the recipient
    const recipientQuery = query(
      friendshipsRef,
      where('recipientId', '==', userId)
    );

    const handleSnapshot = () => {
      // Combine both queries' results
      const allFriendships: BreederFriendship[] = [];
      let requesterDocs: BreederFriendship[] = [];
      let recipientDocs: BreederFriendship[] = [];

      const updateState = () => {
        const combined = [...requesterDocs, ...recipientDocs];
        // Dedupe by id
        const uniqueMap = new Map<string, BreederFriendship>();
        combined.forEach((f) => uniqueMap.set(f.id, f));
        const allFriendships = Array.from(uniqueMap.values());

        const pendingRequests = allFriendships.filter(
          (f) => f.status === 'pending' && f.recipientId === userId
        );
        const sentRequests = allFriendships.filter(
          (f) => f.status === 'pending' && f.requesterId === userId
        );
        const blockedUsers = allFriendships
          .filter((f) => f.status === 'blocked')
          .map((f) => (f.requesterId === userId ? f.recipientId : f.requesterId));

        set({
          friendships: allFriendships,
          pendingRequests,
          sentRequests,
          blockedUsers,
        });
      };

      return { requesterDocs, recipientDocs, updateState };
    };

    const state = handleSnapshot();

    const unsubRequester = onSnapshot(
      requesterQuery,
      (snapshot) => {
        state.requesterDocs = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as BreederFriendship)
        );
        state.updateState();
      },
      (error) => {
        console.error('[breederSocialStore] Requester friendships error:', error);
      }
    );

    const unsubRecipient = onSnapshot(
      recipientQuery,
      (snapshot) => {
        state.recipientDocs = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as BreederFriendship)
        );
        state.updateState();
      },
      (error) => {
        console.error('[breederSocialStore] Recipient friendships error:', error);
      }
    );

    return () => {
      unsubRequester();
      unsubRecipient();
    };
  },

  subscribeToConversations: (userId) => {
    const conversationsRef = collection(db, 'breederConversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const conversations: BreederConversation[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as BreederConversation)
        );

        // Calculate total unread
        const totalUnread = conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount[userId] || 0),
          0
        );

        set({ conversations, totalUnreadMessages: totalUnread });
      },
      (error) => {
        console.error('[breederSocialStore] Conversations snapshot error:', error);
      }
    );
  },

  subscribeToMessages: (conversationId) => {
    const messagesRef = collection(
      db,
      'breederConversations',
      conversationId,
      'messages'
    );
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: BreederMessage[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as BreederMessage)
        );
        set({ currentConversation: messages });
      },
      (error) => {
        console.error('[breederSocialStore] Messages snapshot error:', error);
      }
    );
  },

  // ============================================================================
  // Search
  // ============================================================================

  searchBreeders: async (queryStr) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to search');

    const searchLower = queryStr.toLowerCase();
    const results: BreederSearchResult[] = [];

    try {
      // Search users by kennelName and displayName
      // Note: Firestore doesn't support full-text search, so we use prefix matching
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      const friendships = get().friendships;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (doc.id === user.uid) return; // Skip self

        const kennelName = (data.kennelName || '').toLowerCase();
        const displayName = (data.displayName || '').toLowerCase();

        if (
          kennelName.includes(searchLower) ||
          displayName.includes(searchLower)
        ) {
          // Determine friendship status
          const friendship = friendships.find(
            (f) => f.requesterId === doc.id || f.recipientId === doc.id
          );

          let friendshipStatus: BreederSearchResult['friendshipStatus'] = 'none';
          if (friendship) {
            friendshipStatus = friendship.status;
          }

          results.push({
            id: doc.id,
            displayName: data.displayName || data.email || 'Unknown',
            kennelName: data.kennelName || 'Unknown Kennel',
            location: data.location,
            breed: data.breed,
            photoURL: data.photoURL,
            friendshipStatus,
          });
        }
      });

      return results;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  },

  // ============================================================================
  // Helpers
  // ============================================================================

  getFriendsList: () => {
    return get().friendships.filter((f) => f.status === 'accepted');
  },

  isFriend: (userId) => {
    const friendships = get().friendships;
    return friendships.some(
      (f) =>
        f.status === 'accepted' &&
        (f.requesterId === userId || f.recipientId === userId)
    );
  },

  getFriendship: (userId) => {
    const friendships = get().friendships;
    return friendships.find(
      (f) => f.requesterId === userId || f.recipientId === userId
    );
  },

  // ============================================================================
  // Utility
  // ============================================================================

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      friendships: [],
      pendingRequests: [],
      sentRequests: [],
      blockedUsers: [],
      conversations: [],
      currentConversation: [],
      currentConversationId: null,
      loading: false,
      error: null,
      totalUnreadMessages: 0,
    });
  },
}));
