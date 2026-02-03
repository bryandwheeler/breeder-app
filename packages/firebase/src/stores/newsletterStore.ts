/**
 * Newsletter Store
 *
 * Zustand store for managing newsletter subscribers, lists, campaigns,
 * autoresponders, lead magnets, and signup forms.
 */

import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  increment,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type {
  NewsletterSubscriber,
  NewsletterList,
  EmailCampaign,
  AutoresponderSequence,
  AutoresponderEmail,
  SubscriberSequenceProgress,
  LeadMagnet,
  SignupForm,
  EmailEvent,
  SubscriberStatus,
  CampaignStatus,
} from '@breeder/types';

// Collection names
const COLLECTIONS = {
  LISTS: 'newsletterLists',
  SUBSCRIBERS: 'newsletterSubscribers',
  CAMPAIGNS: 'emailCampaigns',
  SEQUENCES: 'autoresponderSequences',
  SEQUENCE_EMAILS: 'autoresponderEmails',
  SEQUENCE_PROGRESS: 'subscriberSequenceProgress',
  LEAD_MAGNETS: 'leadMagnets',
  SIGNUP_FORMS: 'signupForms',
  EMAIL_EVENTS: 'emailEvents',
} as const;

// Pagination
const PAGE_SIZE = 50;

interface NewsletterStore {
  // State
  lists: NewsletterList[];
  subscribers: NewsletterSubscriber[];
  campaigns: EmailCampaign[];
  sequences: AutoresponderSequence[];
  leadMagnets: LeadMagnet[];
  signupForms: SignupForm[];
  loading: boolean;
  error: string | null;

  // Pagination state
  subscribersLastDoc: DocumentSnapshot | null;
  hasMoreSubscribers: boolean;

  // List operations
  subscribeLists: (ownerId: string, ownerType: 'admin' | 'breeder') => () => void;
  createList: (list: Omit<NewsletterList, 'id' | 'subscriberCount' | 'activeCount' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateList: (id: string, updates: Partial<NewsletterList>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;

  // Subscriber operations
  subscribeSubscribers: (listId?: string) => () => void;
  loadMoreSubscribers: (listId?: string) => Promise<void>;
  getSubscriber: (id: string) => Promise<NewsletterSubscriber | null>;
  getSubscriberByEmail: (email: string) => Promise<NewsletterSubscriber | null>;
  createSubscriber: (subscriber: Omit<NewsletterSubscriber, 'id' | 'createdAt' | 'updatedAt' | 'engagementScore' | 'emailsSent' | 'emailsOpened' | 'emailsClicked'>) => Promise<string>;
  updateSubscriber: (id: string, updates: Partial<NewsletterSubscriber>) => Promise<void>;
  deleteSubscriber: (id: string) => Promise<void>;
  bulkUpdateSubscribers: (ids: string[], updates: Partial<NewsletterSubscriber>) => Promise<void>;
  bulkDeleteSubscribers: (ids: string[]) => Promise<void>;
  addSubscriberToList: (subscriberId: string, listId: string) => Promise<void>;
  removeSubscriberFromList: (subscriberId: string, listId: string) => Promise<void>;
  addTagToSubscriber: (subscriberId: string, tag: string) => Promise<void>;
  removeTagFromSubscriber: (subscriberId: string, tag: string) => Promise<void>;
  unsubscribe: (subscriberId: string) => Promise<void>;

  // Campaign operations
  subscribeCampaigns: (ownerId: string, ownerType: 'admin' | 'breeder') => () => void;
  getCampaign: (id: string) => Promise<EmailCampaign | null>;
  createCampaign: (campaign: Omit<EmailCampaign, 'id' | 'stats' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCampaign: (id: string, updates: Partial<EmailCampaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  scheduleCampaign: (id: string, scheduledFor: string) => Promise<void>;
  cancelCampaign: (id: string) => Promise<void>;

  // Sequence operations
  subscribeSequences: (ownerId: string, ownerType: 'admin' | 'breeder') => () => void;
  getSequence: (id: string) => Promise<AutoresponderSequence | null>;
  createSequence: (sequence: Omit<AutoresponderSequence, 'id' | 'emailCount' | 'subscribersActive' | 'subscribersCompleted' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSequence: (id: string, updates: Partial<AutoresponderSequence>) => Promise<void>;
  deleteSequence: (id: string) => Promise<void>;
  getSequenceEmails: (sequenceId: string) => Promise<AutoresponderEmail[]>;
  createSequenceEmail: (email: Omit<AutoresponderEmail, 'id' | 'stats' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSequenceEmail: (id: string, updates: Partial<AutoresponderEmail>) => Promise<void>;
  deleteSequenceEmail: (id: string) => Promise<void>;
  reorderSequenceEmails: (sequenceId: string, emailIds: string[]) => Promise<void>;

  // Lead Magnet operations
  subscribeLeadMagnets: (ownerId: string, ownerType: 'admin' | 'breeder') => () => void;
  getLeadMagnet: (id: string) => Promise<LeadMagnet | null>;
  createLeadMagnet: (magnet: Omit<LeadMagnet, 'id' | 'downloadCount' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateLeadMagnet: (id: string, updates: Partial<LeadMagnet>) => Promise<void>;
  deleteLeadMagnet: (id: string) => Promise<void>;

  // Signup Form operations
  subscribeSignupForms: (ownerId: string, ownerType: 'admin' | 'breeder') => () => void;
  getSignupForm: (id: string) => Promise<SignupForm | null>;
  createSignupForm: (form: Omit<SignupForm, 'id' | 'views' | 'submissions' | 'conversions' | 'conversionRate' | 'embedCode' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSignupForm: (id: string, updates: Partial<SignupForm>) => Promise<void>;
  deleteSignupForm: (id: string) => Promise<void>;

  // Analytics
  recordEmailEvent: (event: Omit<EmailEvent, 'id'>) => Promise<void>;
  getEmailEvents: (options: { campaignId?: string; subscriberId?: string; limit?: number }) => Promise<EmailEvent[]>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  lists: [],
  subscribers: [],
  campaigns: [],
  sequences: [],
  leadMagnets: [],
  signupForms: [],
  loading: false,
  error: null,
  subscribersLastDoc: null,
  hasMoreSubscribers: true,
};

export const useNewsletterStore = create<NewsletterStore>((set, get) => ({
  ...initialState,

  // ============================================================================
  // List Operations
  // ============================================================================

  subscribeLists: (ownerId: string, ownerType: 'admin' | 'breeder') => {
    const q = ownerType === 'admin'
      ? query(collection(db, COLLECTIONS.LISTS), where('ownerType', '==', 'admin'), orderBy('createdAt', 'desc'))
      : query(collection(db, COLLECTIONS.LISTS), where('ownerId', '==', ownerId), where('ownerType', '==', 'breeder'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lists = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NewsletterList[];
      set({ lists });
    }, (error) => {
      console.error('Error subscribing to lists:', error);
      set({ error: error.message });
    });

    return unsubscribe;
  },

  createList: async (listData) => {
    try {
      set({ loading: true, error: null });
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, COLLECTIONS.LISTS), {
        ...listData,
        subscriberCount: 0,
        activeCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  updateList: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await updateDoc(doc(db, COLLECTIONS.LISTS, id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  deleteList: async (id) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, COLLECTIONS.LISTS, id));
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // ============================================================================
  // Subscriber Operations
  // ============================================================================

  subscribeSubscribers: (listId?: string) => {
    set({ subscribers: [], subscribersLastDoc: null, hasMoreSubscribers: true });

    const baseQuery = listId
      ? query(
          collection(db, COLLECTIONS.SUBSCRIBERS),
          where('listIds', 'array-contains', listId),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        )
      : query(
          collection(db, COLLECTIONS.SUBSCRIBERS),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const subscribers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NewsletterSubscriber[];

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      set({
        subscribers,
        subscribersLastDoc: lastDoc,
        hasMoreSubscribers: snapshot.docs.length === PAGE_SIZE,
      });
    }, (error) => {
      console.error('Error subscribing to subscribers:', error);
      set({ error: error.message });
    });

    return unsubscribe;
  },

  loadMoreSubscribers: async (listId?: string) => {
    const { subscribersLastDoc, hasMoreSubscribers, subscribers } = get();
    if (!hasMoreSubscribers || !subscribersLastDoc) return;

    try {
      const baseQuery = listId
        ? query(
            collection(db, COLLECTIONS.SUBSCRIBERS),
            where('listIds', 'array-contains', listId),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            startAfter(subscribersLastDoc),
            limit(PAGE_SIZE)
          )
        : query(
            collection(db, COLLECTIONS.SUBSCRIBERS),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            startAfter(subscribersLastDoc),
            limit(PAGE_SIZE)
          );

      const snapshot = await getDocs(baseQuery);
      const newSubscribers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NewsletterSubscriber[];

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      set({
        subscribers: [...subscribers, ...newSubscribers],
        subscribersLastDoc: lastDoc,
        hasMoreSubscribers: snapshot.docs.length === PAGE_SIZE,
      });
    } catch (error: any) {
      console.error('Error loading more subscribers:', error);
      set({ error: error.message });
    }
  },

  getSubscriber: async (id) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.SUBSCRIBERS, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as NewsletterSubscriber;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting subscriber:', error);
      return null;
    }
  },

  getSubscriberByEmail: async (email) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBSCRIBERS),
        where('email', '==', email.toLowerCase()),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as NewsletterSubscriber;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting subscriber by email:', error);
      return null;
    }
  },

  createSubscriber: async (subscriberData) => {
    try {
      set({ loading: true, error: null });
      const now = new Date().toISOString();

      // Check for existing subscriber
      const existing = await get().getSubscriberByEmail(subscriberData.email);
      if (existing) {
        throw new Error('Subscriber with this email already exists');
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.SUBSCRIBERS), {
        ...subscriberData,
        email: subscriberData.email.toLowerCase(),
        engagementScore: 0,
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Update list counts
      const batch = writeBatch(db);
      for (const listId of subscriberData.listIds) {
        batch.update(doc(db, COLLECTIONS.LISTS, listId), {
          subscriberCount: increment(1),
          activeCount: subscriberData.status === 'active' ? increment(1) : increment(0),
        });
      }
      await batch.commit();

      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  updateSubscriber: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await updateDoc(doc(db, COLLECTIONS.SUBSCRIBERS, id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  deleteSubscriber: async (id) => {
    try {
      set({ loading: true, error: null });

      // Get subscriber to update list counts
      const subscriber = await get().getSubscriber(id);
      if (subscriber) {
        const batch = writeBatch(db);
        batch.delete(doc(db, COLLECTIONS.SUBSCRIBERS, id));

        for (const listId of subscriber.listIds) {
          batch.update(doc(db, COLLECTIONS.LISTS, listId), {
            subscriberCount: increment(-1),
            activeCount: subscriber.status === 'active' ? increment(-1) : increment(0),
          });
        }
        await batch.commit();
      } else {
        await deleteDoc(doc(db, COLLECTIONS.SUBSCRIBERS, id));
      }

      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  bulkUpdateSubscribers: async (ids, updates) => {
    try {
      set({ loading: true, error: null });
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const id of ids) {
        batch.update(doc(db, COLLECTIONS.SUBSCRIBERS, id), {
          ...updates,
          updatedAt: now,
        });
      }

      await batch.commit();
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  bulkDeleteSubscribers: async (ids) => {
    try {
      set({ loading: true, error: null });
      const batch = writeBatch(db);

      for (const id of ids) {
        batch.delete(doc(db, COLLECTIONS.SUBSCRIBERS, id));
      }

      await batch.commit();
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  addSubscriberToList: async (subscriberId, listId) => {
    try {
      const subscriber = await get().getSubscriber(subscriberId);
      if (!subscriber) throw new Error('Subscriber not found');
      if (subscriber.listIds.includes(listId)) return;

      const batch = writeBatch(db);
      batch.update(doc(db, COLLECTIONS.SUBSCRIBERS, subscriberId), {
        listIds: [...subscriber.listIds, listId],
        updatedAt: new Date().toISOString(),
      });
      batch.update(doc(db, COLLECTIONS.LISTS, listId), {
        subscriberCount: increment(1),
        activeCount: subscriber.status === 'active' ? increment(1) : increment(0),
      });
      await batch.commit();
    } catch (error: any) {
      console.error('Error adding subscriber to list:', error);
      throw error;
    }
  },

  removeSubscriberFromList: async (subscriberId, listId) => {
    try {
      const subscriber = await get().getSubscriber(subscriberId);
      if (!subscriber) throw new Error('Subscriber not found');
      if (!subscriber.listIds.includes(listId)) return;

      const batch = writeBatch(db);
      batch.update(doc(db, COLLECTIONS.SUBSCRIBERS, subscriberId), {
        listIds: subscriber.listIds.filter((id) => id !== listId),
        updatedAt: new Date().toISOString(),
      });
      batch.update(doc(db, COLLECTIONS.LISTS, listId), {
        subscriberCount: increment(-1),
        activeCount: subscriber.status === 'active' ? increment(-1) : increment(0),
      });
      await batch.commit();
    } catch (error: any) {
      console.error('Error removing subscriber from list:', error);
      throw error;
    }
  },

  addTagToSubscriber: async (subscriberId, tag) => {
    try {
      const subscriber = await get().getSubscriber(subscriberId);
      if (!subscriber) throw new Error('Subscriber not found');
      if (subscriber.tags.includes(tag)) return;

      await updateDoc(doc(db, COLLECTIONS.SUBSCRIBERS, subscriberId), {
        tags: [...subscriber.tags, tag],
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error adding tag to subscriber:', error);
      throw error;
    }
  },

  removeTagFromSubscriber: async (subscriberId, tag) => {
    try {
      const subscriber = await get().getSubscriber(subscriberId);
      if (!subscriber) throw new Error('Subscriber not found');

      await updateDoc(doc(db, COLLECTIONS.SUBSCRIBERS, subscriberId), {
        tags: subscriber.tags.filter((t) => t !== tag),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error removing tag from subscriber:', error);
      throw error;
    }
  },

  unsubscribe: async (subscriberId) => {
    try {
      const subscriber = await get().getSubscriber(subscriberId);
      if (!subscriber) throw new Error('Subscriber not found');

      const batch = writeBatch(db);
      batch.update(doc(db, COLLECTIONS.SUBSCRIBERS, subscriberId), {
        status: 'unsubscribed',
        unsubscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update active counts for all lists
      for (const listId of subscriber.listIds) {
        if (subscriber.status === 'active') {
          batch.update(doc(db, COLLECTIONS.LISTS, listId), {
            activeCount: increment(-1),
          });
        }
      }

      await batch.commit();
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      throw error;
    }
  },

  // ============================================================================
  // Campaign Operations
  // ============================================================================

  subscribeCampaigns: (ownerId: string, ownerType: 'admin' | 'breeder') => {
    const q = ownerType === 'admin'
      ? query(collection(db, COLLECTIONS.CAMPAIGNS), where('ownerType', '==', 'admin'), orderBy('createdAt', 'desc'))
      : query(collection(db, COLLECTIONS.CAMPAIGNS), where('ownerId', '==', ownerId), where('ownerType', '==', 'breeder'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const campaigns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailCampaign[];
      set({ campaigns });
    }, (error) => {
      console.error('Error subscribing to campaigns:', error);
      set({ error: error.message });
    });

    return unsubscribe;
  },

  getCampaign: async (id) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.CAMPAIGNS, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as EmailCampaign;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting campaign:', error);
      return null;
    }
  },

  createCampaign: async (campaignData) => {
    try {
      set({ loading: true, error: null });
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, COLLECTIONS.CAMPAIGNS), {
        ...campaignData,
        stats: {
          sent: 0,
          delivered: 0,
          opened: 0,
          uniqueOpens: 0,
          clicked: 0,
          uniqueClicks: 0,
          bounced: 0,
          softBounced: 0,
          hardBounced: 0,
          unsubscribed: 0,
          complained: 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0,
        },
        createdAt: now,
        updatedAt: now,
      });
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  updateCampaign: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await updateDoc(doc(db, COLLECTIONS.CAMPAIGNS, id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  deleteCampaign: async (id) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, COLLECTIONS.CAMPAIGNS, id));
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  scheduleCampaign: async (id, scheduledFor) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.CAMPAIGNS, id), {
        status: 'scheduled',
        scheduledFor,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error scheduling campaign:', error);
      throw error;
    }
  },

  cancelCampaign: async (id) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.CAMPAIGNS, id), {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error cancelling campaign:', error);
      throw error;
    }
  },

  // ============================================================================
  // Sequence Operations
  // ============================================================================

  subscribeSequences: (ownerId: string, ownerType: 'admin' | 'breeder') => {
    const q = ownerType === 'admin'
      ? query(collection(db, COLLECTIONS.SEQUENCES), where('ownerType', '==', 'admin'), orderBy('createdAt', 'desc'))
      : query(collection(db, COLLECTIONS.SEQUENCES), where('ownerId', '==', ownerId), where('ownerType', '==', 'breeder'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sequences = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AutoresponderSequence[];
      set({ sequences });
    }, (error) => {
      console.error('Error subscribing to sequences:', error);
      set({ error: error.message });
    });

    return unsubscribe;
  },

  getSequence: async (id) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.SEQUENCES, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AutoresponderSequence;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting sequence:', error);
      return null;
    }
  },

  createSequence: async (sequenceData) => {
    try {
      set({ loading: true, error: null });
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, COLLECTIONS.SEQUENCES), {
        ...sequenceData,
        emailCount: 0,
        subscribersActive: 0,
        subscribersCompleted: 0,
        createdAt: now,
        updatedAt: now,
      });
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  updateSequence: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await updateDoc(doc(db, COLLECTIONS.SEQUENCES, id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  deleteSequence: async (id) => {
    try {
      set({ loading: true, error: null });

      // Delete all emails in sequence
      const emailsQuery = query(
        collection(db, COLLECTIONS.SEQUENCE_EMAILS),
        where('sequenceId', '==', id)
      );
      const emailsSnapshot = await getDocs(emailsQuery);

      const batch = writeBatch(db);
      emailsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      batch.delete(doc(db, COLLECTIONS.SEQUENCES, id));
      await batch.commit();

      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  getSequenceEmails: async (sequenceId) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.SEQUENCE_EMAILS),
        where('sequenceId', '==', sequenceId),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AutoresponderEmail[];
    } catch (error: any) {
      console.error('Error getting sequence emails:', error);
      return [];
    }
  },

  createSequenceEmail: async (emailData) => {
    try {
      set({ loading: true, error: null });
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, COLLECTIONS.SEQUENCE_EMAILS), {
        ...emailData,
        stats: { sent: 0, opened: 0, clicked: 0, unsubscribed: 0 },
        createdAt: now,
        updatedAt: now,
      });

      // Update email count
      await updateDoc(doc(db, COLLECTIONS.SEQUENCES, emailData.sequenceId), {
        emailCount: increment(1),
        updatedAt: now,
      });

      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  updateSequenceEmail: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await updateDoc(doc(db, COLLECTIONS.SEQUENCE_EMAILS, id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  deleteSequenceEmail: async (id) => {
    try {
      set({ loading: true, error: null });

      const emailDoc = await getDoc(doc(db, COLLECTIONS.SEQUENCE_EMAILS, id));
      if (emailDoc.exists()) {
        const email = emailDoc.data() as AutoresponderEmail;

        const batch = writeBatch(db);
        batch.delete(doc(db, COLLECTIONS.SEQUENCE_EMAILS, id));
        batch.update(doc(db, COLLECTIONS.SEQUENCES, email.sequenceId), {
          emailCount: increment(-1),
          updatedAt: new Date().toISOString(),
        });
        await batch.commit();
      }

      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  reorderSequenceEmails: async (sequenceId, emailIds) => {
    try {
      set({ loading: true, error: null });
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      emailIds.forEach((id, index) => {
        batch.update(doc(db, COLLECTIONS.SEQUENCE_EMAILS, id), {
          order: index + 1,
          updatedAt: now,
        });
      });

      await batch.commit();
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // ============================================================================
  // Lead Magnet Operations
  // ============================================================================

  subscribeLeadMagnets: (ownerId: string, ownerType: 'admin' | 'breeder') => {
    const q = ownerType === 'admin'
      ? query(collection(db, COLLECTIONS.LEAD_MAGNETS), where('ownerType', '==', 'admin'), orderBy('createdAt', 'desc'))
      : query(collection(db, COLLECTIONS.LEAD_MAGNETS), where('ownerId', '==', ownerId), where('ownerType', '==', 'breeder'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadMagnets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LeadMagnet[];
      set({ leadMagnets });
    }, (error) => {
      console.error('Error subscribing to lead magnets:', error);
      set({ error: error.message });
    });

    return unsubscribe;
  },

  getLeadMagnet: async (id) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.LEAD_MAGNETS, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as LeadMagnet;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting lead magnet:', error);
      return null;
    }
  },

  createLeadMagnet: async (magnetData) => {
    try {
      set({ loading: true, error: null });
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, COLLECTIONS.LEAD_MAGNETS), {
        ...magnetData,
        downloadCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  updateLeadMagnet: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await updateDoc(doc(db, COLLECTIONS.LEAD_MAGNETS, id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  deleteLeadMagnet: async (id) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, COLLECTIONS.LEAD_MAGNETS, id));
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // ============================================================================
  // Signup Form Operations
  // ============================================================================

  subscribeSignupForms: (ownerId: string, ownerType: 'admin' | 'breeder') => {
    const q = ownerType === 'admin'
      ? query(collection(db, COLLECTIONS.SIGNUP_FORMS), where('ownerType', '==', 'admin'), orderBy('createdAt', 'desc'))
      : query(collection(db, COLLECTIONS.SIGNUP_FORMS), where('ownerId', '==', ownerId), where('ownerType', '==', 'breeder'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const signupForms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SignupForm[];
      set({ signupForms });
    }, (error) => {
      console.error('Error subscribing to signup forms:', error);
      set({ error: error.message });
    });

    return unsubscribe;
  },

  getSignupForm: async (id) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.SIGNUP_FORMS, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as SignupForm;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting signup form:', error);
      return null;
    }
  },

  createSignupForm: async (formData) => {
    try {
      set({ loading: true, error: null });
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, COLLECTIONS.SIGNUP_FORMS), {
        ...formData,
        views: 0,
        submissions: 0,
        conversions: 0,
        conversionRate: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Generate embed code after creation
      const embedCode = `<script src="https://expert-breeder.web.app/embed/form.js" data-form-id="${docRef.id}"></script>`;
      await updateDoc(docRef, { embedCode });

      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  updateSignupForm: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await updateDoc(doc(db, COLLECTIONS.SIGNUP_FORMS, id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  deleteSignupForm: async (id) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, COLLECTIONS.SIGNUP_FORMS, id));
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // ============================================================================
  // Analytics
  // ============================================================================

  recordEmailEvent: async (event) => {
    try {
      await addDoc(collection(db, COLLECTIONS.EMAIL_EVENTS), {
        ...event,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error recording email event:', error);
    }
  },

  getEmailEvents: async (options) => {
    try {
      let q = query(collection(db, COLLECTIONS.EMAIL_EVENTS), orderBy('timestamp', 'desc'));

      if (options.campaignId) {
        q = query(q, where('campaignId', '==', options.campaignId));
      }
      if (options.subscriberId) {
        q = query(q, where('subscriberId', '==', options.subscriberId));
      }
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailEvent[];
    } catch (error: any) {
      console.error('Error getting email events:', error);
      return [];
    }
  },

  // ============================================================================
  // Utility
  // ============================================================================

  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
