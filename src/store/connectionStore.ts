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
  or,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DogConnectionRequest, Notification } from '@/types/dog';

interface ConnectionStore {
  // Connection Requests
  incomingRequests: DogConnectionRequest[];
  outgoingRequests: DogConnectionRequest[];
  notifications: Notification[];
  unreadCount: number;

  // Actions
  createConnectionRequest: (
    request: Omit<DogConnectionRequest, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updateConnectionRequest: (
    id: string,
    updates: Partial<DogConnectionRequest>
  ) => Promise<void>;
  approveConnectionRequest: (
    id: string,
    sharingPreferences: any,
    responseMessage?: string
  ) => Promise<void>;
  declineConnectionRequest: (
    id: string,
    responseMessage?: string
  ) => Promise<void>;
  cancelConnectionRequest: (id: string) => Promise<void>;
  deleteConnectionRequest: (id: string) => Promise<void>;

  // Notifications
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: (userId: string) => Promise<void>;

  // Subscription
  subscribeToConnectionRequests: (userId: string) => () => void;
  subscribeToNotifications: (userId: string) => () => void;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  incomingRequests: [],
  outgoingRequests: [],
  notifications: [],
  unreadCount: 0,

  createConnectionRequest: async (request) => {
    const docRef = await addDoc(collection(db, 'connectionRequests'), {
      ...request,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  updateConnectionRequest: async (id, updates) => {
    const docRef = doc(db, 'connectionRequests', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  approveConnectionRequest: async (id, sharingPreferences, responseMessage) => {
    const docRef = doc(db, 'connectionRequests', id);
    const updateData: any = {
      status: 'approved',
      sharingPreferences,
      responseDate: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    // Only add responseMessage if it has a value
    if (responseMessage?.trim()) {
      updateData.responseMessage = responseMessage.trim();
    }

    await updateDoc(docRef, updateData);
  },

  declineConnectionRequest: async (id, responseMessage) => {
    const docRef = doc(db, 'connectionRequests', id);
    const updateData: any = {
      status: 'declined',
      responseDate: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    // Only add responseMessage if it has a value
    if (responseMessage?.trim()) {
      updateData.responseMessage = responseMessage.trim();
    }

    await updateDoc(docRef, updateData);
  },

  cancelConnectionRequest: async (id) => {
    const docRef = doc(db, 'connectionRequests', id);
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  },

  deleteConnectionRequest: async (id) => {
    const docRef = doc(db, 'connectionRequests', id);
    await deleteDoc(docRef);
  },

  addNotification: async (notification) => {
    await addDoc(collection(db, 'notifications'), {
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    });
  },

  markNotificationAsRead: async (id) => {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, {
      read: true,
      readAt: new Date().toISOString(),
    });
  },

  markAllNotificationsAsRead: async (userId) => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        read: true,
        readAt: new Date().toISOString(),
      })
    );
    await Promise.all(updates);
  },

  subscribeToConnectionRequests: (userId) => {
    // Subscribe to incoming requests (where user is the owner)
    const incomingQuery = query(
      collection(db, 'connectionRequests'),
      where('ownerId', '==', userId)
    );

    const unsubscribeIncoming = onSnapshot(
      incomingQuery,
      (snapshot) => {
        const requests: DogConnectionRequest[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              createdAt:
                doc.data().createdAt?.toDate?.()?.toISOString() ||
                doc.data().createdAt,
              updatedAt:
                doc.data().updatedAt?.toDate?.()?.toISOString() ||
                doc.data().updatedAt,
            } as DogConnectionRequest)
        );
        set({ incomingRequests: requests });
      },
      (error) => {
        console.error(
          '[connectionStore] Incoming requests snapshot error:',
          error
        );
      }
    );

    // Subscribe to outgoing requests (where user is the requester)
    const outgoingQuery = query(
      collection(db, 'connectionRequests'),
      where('requesterId', '==', userId)
    );

    const unsubscribeOutgoing = onSnapshot(
      outgoingQuery,
      (snapshot) => {
        const requests: DogConnectionRequest[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              createdAt:
                doc.data().createdAt?.toDate?.()?.toISOString() ||
                doc.data().createdAt,
              updatedAt:
                doc.data().updatedAt?.toDate?.()?.toISOString() ||
                doc.data().updatedAt,
            } as DogConnectionRequest)
        );
        set({ outgoingRequests: requests });
      },
      (error) => {
        console.error(
          '[connectionStore] Outgoing requests snapshot error:',
          error
        );
      }
    );

    return () => {
      unsubscribeIncoming();
      unsubscribeOutgoing();
    };
  },

  subscribeToNotifications: (userId) => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              createdAt:
                doc.data().createdAt?.toDate?.()?.toISOString() ||
                doc.data().createdAt,
              readAt:
                doc.data().readAt?.toDate?.()?.toISOString() ||
                doc.data().readAt,
            } as Notification)
        );

        const unreadCount = notifications.filter((n) => !n.read).length;

        set({
          notifications: notifications.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          unreadCount,
        });
      },
      (error) => {
        console.error('[connectionStore] Notifications snapshot error:', error);
      }
    );
  },
}));
