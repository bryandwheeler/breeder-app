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
  orderBy,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import {
  Customer,
  Interaction,
  Purchase,
  Referral,
  CustomerSegment,
} from '@/types/dog';

interface Store {
  customers: Customer[];
  segments: CustomerSegment[];
  referrals: Referral[];
  loading: boolean;

  // Customer CRUD
  addCustomer: (
    customer: Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;

  // Interaction Management
  addInteraction: (
    customerId: string,
    interaction: Omit<Interaction, 'id'>
  ) => Promise<void>;
  updateInteraction: (
    customerId: string,
    interactionId: string,
    updates: Partial<Interaction>
  ) => Promise<void>;
  deleteInteraction: (
    customerId: string,
    interactionId: string
  ) => Promise<void>;

  // Purchase Management
  addPurchase: (
    customerId: string,
    purchase: Omit<Purchase, 'id'>
  ) => Promise<void>;
  updatePurchase: (
    customerId: string,
    purchaseId: string,
    updates: Partial<Purchase>
  ) => Promise<void>;

  // Customer Analytics
  calculateLifetimeValue: (customerId: string) => Promise<void>;
  updateCustomerStats: (customerId: string) => Promise<void>;

  // Tags & Segmentation
  addTag: (customerId: string, tag: string) => Promise<void>;
  removeTag: (customerId: string, tag: string) => Promise<void>;
  createSegment: (segment: Omit<CustomerSegment, 'id'>) => Promise<void>;
  updateSegment: (
    id: string,
    updates: Partial<CustomerSegment>
  ) => Promise<void>;
  deleteSegment: (id: string) => Promise<void>;
  getCustomersBySegment: (segmentId: string) => Customer[];

  // Referral Management
  addReferral: (
    referral: Omit<Referral, 'id' | 'userId' | 'referralDate'>
  ) => Promise<void>;
  updateReferral: (id: string, updates: Partial<Referral>) => Promise<void>;
  convertReferral: (id: string) => Promise<void>;

  // Link existing records
  linkInquiry: (customerId: string, inquiryId: string) => Promise<void>;
  linkWaitlistEntry: (
    customerId: string,
    waitlistEntryId: string
  ) => Promise<void>;
  linkLitter: (customerId: string, litterId: string) => Promise<void>;

  // Conversion helpers
  convertInquiryToCustomer: (
    inquiryId: string,
    additionalData?: Partial<Customer>
  ) => Promise<string>;
  convertWaitlistToCustomer: (
    waitlistEntryId: string,
    additionalData?: Partial<Customer>
  ) => Promise<string>;

  // Subscriptions
  subscribeToCustomers: () => () => void;
  subscribeToSegments: () => () => void;
  subscribeToReferrals: () => () => void;
}

export const useCrmStore = create<Store>()((set, get) => ({
  customers: [],
  segments: [],
  referrals: [],
  loading: false,

  // Customer CRUD
  addCustomer: async (customer) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    const newCustomer: any = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      type: customer.type || 'prospect',
      status: customer.status || 'active',
      source: customer.source || 'website',
      preferredContact: customer.preferredContact || 'email',
      emailOptIn:
        customer.emailOptIn !== undefined ? customer.emailOptIn : true,
      smsOptIn: customer.smsOptIn !== undefined ? customer.smsOptIn : false,
      // Backward-compat: write both fields; rules use breederId
      userId: user.uid,
      breederId: user.uid,
      firstContactDate:
        customer.firstContactDate || new Date().toISOString().split('T')[0],
      lastContactDate: new Date().toISOString().split('T')[0],
      totalPurchases: 0,
      totalRevenue: 0,
      lifetimeValue: 0,
      interactions: [],
      purchases: [],
      tags: customer.tags || [],
      notes: customer.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'customers'), newCustomer);
  },

  updateCustomer: async (id, updates) => {
    // Filter out undefined values - Firestore doesn't support them
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    const customerRef = doc(db, 'customers', id);
    await updateDoc(customerRef, {
      ...filteredUpdates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteCustomer: async (id) => {
    await deleteDoc(doc(db, 'customers', id));
  },

  getCustomer: (id) => {
    return get().customers.find((c) => c.id === id);
  },

  // Interaction Management
  addInteraction: async (customerId, interaction) => {
    const customer = get().getCustomer(customerId);
    if (!customer) throw new Error('Customer not found');

    const newInteraction: Interaction = {
      ...interaction,
      id: crypto.randomUUID(),
    };

    const interactions = [...(customer.interactions || []), newInteraction];

    await updateDoc(doc(db, 'customers', customerId), {
      interactions,
      lastContactDate: interaction.date,
      updatedAt: serverTimestamp(),
    });
  },

  updateInteraction: async (customerId, interactionId, updates) => {
    const customer = get().getCustomer(customerId);
    if (!customer) throw new Error('Customer not found');

    const interactions =
      customer.interactions?.map((i) =>
        i.id === interactionId ? { ...i, ...updates } : i
      ) || [];

    await updateDoc(doc(db, 'customers', customerId), {
      interactions,
      updatedAt: serverTimestamp(),
    });
  },

  deleteInteraction: async (customerId, interactionId) => {
    const customer = get().getCustomer(customerId);
    if (!customer) throw new Error('Customer not found');

    const interactions =
      customer.interactions?.filter((i) => i.id !== interactionId) || [];

    await updateDoc(doc(db, 'customers', customerId), {
      interactions,
      updatedAt: serverTimestamp(),
    });
  },

  // Purchase Management
  addPurchase: async (customerId, purchase) => {
    const customer = get().getCustomer(customerId);
    if (!customer) throw new Error('Customer not found');

    const newPurchase: Purchase = {
      ...purchase,
      id: crypto.randomUUID(),
    };

    const purchases = [...(customer.purchases || []), newPurchase];

    await updateDoc(doc(db, 'customers', customerId), {
      purchases,
      lastPurchaseDate: purchase.purchaseDate,
      updatedAt: serverTimestamp(),
    });

    // Recalculate stats
    await get().updateCustomerStats(customerId);
  },

  updatePurchase: async (customerId, purchaseId, updates) => {
    const customer = get().getCustomer(customerId);
    if (!customer) throw new Error('Customer not found');

    const purchases =
      customer.purchases?.map((p) =>
        p.id === purchaseId ? { ...p, ...updates } : p
      ) || [];

    await updateDoc(doc(db, 'customers', customerId), {
      purchases,
      updatedAt: serverTimestamp(),
    });

    // Recalculate stats
    await get().updateCustomerStats(customerId);
  },

  // Customer Analytics
  calculateLifetimeValue: async (customerId) => {
    const customer = get().getCustomer(customerId);
    if (!customer) return;

    const totalRevenue =
      customer.purchases?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const averagePurchaseValue = customer.purchases?.length
      ? totalRevenue / customer.purchases.length
      : 0;

    // Simple LTV calculation: total revenue + potential future value
    // Assume repeat customers may purchase again
    const repeatMultiplier =
      customer.purchases && customer.purchases.length > 1 ? 1.5 : 1;
    const lifetimeValue = totalRevenue * repeatMultiplier;

    await updateDoc(doc(db, 'customers', customerId), {
      lifetimeValue,
      updatedAt: serverTimestamp(),
    });
  },

  updateCustomerStats: async (customerId) => {
    const customer = get().getCustomer(customerId);
    if (!customer) return;

    const totalPurchases = customer.purchases?.length || 0;
    const totalRevenue =
      customer.purchases?.reduce((sum, p) => sum + p.amount, 0) || 0;

    await updateDoc(doc(db, 'customers', customerId), {
      totalPurchases,
      totalRevenue,
      updatedAt: serverTimestamp(),
    });

    // Also update lifetime value
    await get().calculateLifetimeValue(customerId);
  },

  // Tags & Segmentation
  addTag: async (customerId, tag) => {
    const customer = get().getCustomer(customerId);
    if (!customer) throw new Error('Customer not found');

    const tags = [...(customer.tags || []), tag];
    const uniqueTags = [...new Set(tags)]; // Remove duplicates

    await updateDoc(doc(db, 'customers', customerId), {
      tags: uniqueTags,
      updatedAt: serverTimestamp(),
    });
  },

  removeTag: async (customerId, tag) => {
    const customer = get().getCustomer(customerId);
    if (!customer) throw new Error('Customer not found');

    const tags = customer.tags?.filter((t) => t !== tag) || [];

    await updateDoc(doc(db, 'customers', customerId), {
      tags,
      updatedAt: serverTimestamp(),
    });
  },

  createSegment: async (segment) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    await addDoc(collection(db, 'customer_segments'), {
      ...segment,
      userId: user.uid,
      breederId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  updateSegment: async (id, updates) => {
    // Filter out undefined values - Firestore doesn't support them
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(doc(db, 'customer_segments', id), {
      ...filteredUpdates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteSegment: async (id) => {
    await deleteDoc(doc(db, 'customer_segments', id));
  },

  getCustomersBySegment: (segmentId) => {
    const segment = get().segments.find((s) => s.id === segmentId);
    if (!segment) return [];

    return get().customers.filter((customer) => {
      const { filters } = segment;

      // Type filter
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(customer.type)) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some((tag) => customer.tags?.includes(tag));
        if (!hasTag) return false;
      }

      // Min purchases
      if (
        filters.minPurchases &&
        (customer.totalPurchases || 0) < filters.minPurchases
      ) {
        return false;
      }

      // Min lifetime value
      if (
        filters.minLifetimeValue &&
        (customer.lifetimeValue || 0) < filters.minLifetimeValue
      ) {
        return false;
      }

      // Last contact days ago
      if (filters.lastContactDaysAgo && customer.lastContactDate) {
        const daysSinceContact = Math.floor(
          (Date.now() - new Date(customer.lastContactDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysSinceContact < filters.lastContactDaysAgo) return false;
      }

      return true;
    });
  },

  // Referral Management
  addReferral: async (referral) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    await addDoc(collection(db, 'referrals'), {
      ...referral,
      userId: user.uid,
      breederId: user.uid,
      referralDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  updateReferral: async (id, updates) => {
    // Filter out undefined values - Firestore doesn't support them
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(doc(db, 'referrals', id), {
      ...filteredUpdates,
      updatedAt: serverTimestamp(),
    });
  },

  convertReferral: async (id) => {
    await updateDoc(doc(db, 'referrals', id), {
      status: 'converted',
      conversionDate: new Date().toISOString().split('T')[0],
      updatedAt: serverTimestamp(),
    });
  },

  // Link existing records
  linkInquiry: async (customerId, inquiryId) => {
    const customer = get().getCustomer(customerId);
    if (!customer) throw new Error('Customer not found');

    const inquiryIds = [...(customer.inquiryIds || []), inquiryId];
    const uniqueInquiryIds = [...new Set(inquiryIds)];

    await updateDoc(doc(db, 'customers', customerId), {
      inquiryIds: uniqueInquiryIds,
      updatedAt: serverTimestamp(),
    });
  },

  linkWaitlistEntry: async (customerId, waitlistEntryId) => {
    await updateDoc(doc(db, 'customers', customerId), {
      waitlistEntryId,
      updatedAt: serverTimestamp(),
    });
  },

  linkLitter: async (customerId, litterId) => {
    const customer = get().getCustomer(customerId);
    if (!customer) throw new Error('Customer not found');

    const litterIds = [...(customer.litterIds || []), litterId];
    const uniqueLitterIds = [...new Set(litterIds)];

    await updateDoc(doc(db, 'customers', customerId), {
      litterIds: uniqueLitterIds,
      updatedAt: serverTimestamp(),
    });
  },

  // Conversion helpers
  convertInquiryToCustomer: async (inquiryId, additionalData = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    // Fetch the inquiry
    const inquiriesQuery = query(
      collection(db, 'inquiries'),
      where('userId', '==', user.uid)
    );
    const snapshot = await getDocs(inquiriesQuery);
    const inquiry = snapshot.docs.find((doc) => doc.id === inquiryId)?.data();

    if (!inquiry) throw new Error('Inquiry not found');

    // Create customer from inquiry data
    const customerData: Omit<
      Customer,
      'id' | 'userId' | 'createdAt' | 'updatedAt'
    > = {
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      type: 'prospect',
      status: 'active',
      source: inquiry.source || 'website',
      inquiryIds: [inquiryId],
      firstContactDate:
        inquiry.createdAt || new Date().toISOString().split('T')[0],
      lastContactDate: new Date().toISOString().split('T')[0],
      interactions: [
        {
          id: crypto.randomUUID(),
          date: inquiry.createdAt || new Date().toISOString().split('T')[0],
          type: 'other',
          subject: 'Initial inquiry submitted',
          notes: inquiry.message,
        },
      ],
      ...additionalData,
    };

    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      userId: user.uid,
      breederId: user.uid,
      totalPurchases: 0,
      totalRevenue: 0,
      lifetimeValue: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  convertWaitlistToCustomer: async (waitlistEntryId, additionalData = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    // Fetch the waitlist entry
    const waitlistQuery = query(
      collection(db, 'waitlist'),
      where('breederId', '==', user.uid)
    );
    const snapshot = await getDocs(waitlistQuery);
    const waitlistEntry = snapshot.docs
      .find((doc) => doc.id === waitlistEntryId)
      ?.data();

    if (!waitlistEntry) throw new Error('Waitlist entry not found');

    // Create customer from waitlist data
    const customerData: Omit<
      Customer,
      'id' | 'userId' | 'createdAt' | 'updatedAt'
    > = {
      name: waitlistEntry.name,
      email: waitlistEntry.email,
      phone: waitlistEntry.phone,
      address: waitlistEntry.address,
      city: waitlistEntry.city,
      state: waitlistEntry.state,
      type: 'waitlist',
      status: 'active',
      source: 'website',
      waitlistEntryId,
      firstContactDate:
        waitlistEntry.applicationDate || new Date().toISOString().split('T')[0],
      lastContactDate: new Date().toISOString().split('T')[0],
      interactions: [
        {
          id: crypto.randomUUID(),
          date:
            waitlistEntry.applicationDate ||
            new Date().toISOString().split('T')[0],
          type: 'other',
          subject: 'Waitlist application submitted',
          notes: `Application details:\n- Preferred sex: ${waitlistEntry.preferredSex}\n- Timeline: ${waitlistEntry.timeline}\n- Experience: ${waitlistEntry.experience}`,
        },
      ],
      ...additionalData,
    };

    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      userId: user.uid,
      breederId: user.uid,
      totalPurchases: 0,
      totalRevenue: 0,
      lifetimeValue: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  // Subscriptions
  subscribeToCustomers: () => {
    const user = auth.currentUser;
    if (!user) return () => {};

    set({ loading: true });

    const customersQuery = query(
      collection(db, 'customers'),
      where('breederId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      customersQuery,
      (snapshot) => {
        const customers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Customer[];

        // Sort by lastContactDate in memory
        customers.sort((a, b) => {
          const dateA = a.lastContactDate
            ? new Date(a.lastContactDate).getTime()
            : 0;
          const dateB = b.lastContactDate
            ? new Date(b.lastContactDate).getTime()
            : 0;
          return dateB - dateA;
        });

        set({ customers, loading: false });
      },
      (error) => {
        console.error('[crmStore] Customers snapshot error:', error);
        set({ loading: false });
      }
    );

    return unsubscribe;
  },

  subscribeToSegments: () => {
    const user = auth.currentUser;
    if (!user) return () => {};

    const segmentsQuery = query(
      collection(db, 'customer_segments'),
      where('breederId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      segmentsQuery,
      (snapshot) => {
        const segments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CustomerSegment[];

        set({ segments });
      },
      (error) => {
        console.error('[crmStore] Segments snapshot error:', error);
      }
    );

    return unsubscribe;
  },

  subscribeToReferrals: () => {
    const user = auth.currentUser;
    if (!user) return () => {};

    const referralsQuery = query(
      collection(db, 'referrals'),
      where('breederId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      referralsQuery,
      (snapshot) => {
        const referrals = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Referral[];

        // Sort by referralDate in memory
        referrals.sort((a, b) => {
          const dateA = a.referralDate ? new Date(a.referralDate).getTime() : 0;
          const dateB = b.referralDate ? new Date(b.referralDate).getTime() : 0;
          return dateB - dateA;
        });

        set({ referrals });
      },
      (error) => {
        console.error('[crmStore] Referrals snapshot error:', error);
      }
    );

    return unsubscribe;
  },
}));
