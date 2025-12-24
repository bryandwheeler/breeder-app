// Firestore-powered waitlist store
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
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { WaitlistEntry } from '@breeder/types';

type Store = {
  waitlist: WaitlistEntry[];
  loading: boolean;

  // Waitlist methods
  addToWaitlist: (
    entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateWaitlistEntry: (
    id: string,
    updates: Partial<WaitlistEntry>
  ) => Promise<void>;
  deleteWaitlistEntry: (id: string) => Promise<void>;
  reorderWaitlist: (entries: WaitlistEntry[]) => Promise<void>;
  moveToPosition: (id: string, newPosition: number) => Promise<void>;

  // Public methods (for waitlist application form)
  submitWaitlistApplication: (
    entry: Omit<WaitlistEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;

  // Subscription
  subscribeToWaitlist: () => () => void;
};

export const useWaitlistStore = create<Store>()((set, get) => ({
  waitlist: [],
  loading: false,

  addToWaitlist: async (entry) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add to waitlist');

    const waitlistRef = collection(db, 'waitlist');

    // Get current waitlist count to set position
    const currentWaitlist = get().waitlist.filter(
      (e) => e.status === 'active' || e.status === 'approved'
    );
    const position = currentWaitlist.length + 1;

    const newEntry = {
      ...entry,
      // Backward-compat: record both, rules use breederId
      userId: user.uid,
      breederId: user.uid,
      position,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(waitlistRef, newEntry);
  },

  updateWaitlistEntry: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update waitlist');

    const entryRef = doc(db, 'waitlist', id);
    await updateDoc(entryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteWaitlistEntry: async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete waitlist entry');

    const entryRef = doc(db, 'waitlist', id);
    await deleteDoc(entryRef);

    // Reorder remaining entries
    const remainingEntries = get()
      .waitlist.filter(
        (e) => e.id !== id && (e.status === 'active' || e.status === 'approved')
      )
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    for (let i = 0; i < remainingEntries.length; i++) {
      await updateDoc(doc(db, 'waitlist', remainingEntries[i].id), {
        position: i + 1,
        updatedAt: serverTimestamp(),
      });
    }
  },

  reorderWaitlist: async (entries) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to reorder waitlist');

    // Update positions for all entries
    for (let i = 0; i < entries.length; i++) {
      const entryRef = doc(db, 'waitlist', entries[i].id);
      await updateDoc(entryRef, {
        position: i + 1,
        updatedAt: serverTimestamp(),
      });
    }
  },

  moveToPosition: async (id, newPosition) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to reorder waitlist');

    const waitlist = get()
      .waitlist.filter((e) => e.status === 'active' || e.status === 'approved')
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const entryIndex = waitlist.findIndex((e) => e.id === id);
    if (entryIndex === -1) return;

    // Reorder array
    const entry = waitlist[entryIndex];
    waitlist.splice(entryIndex, 1);
    waitlist.splice(newPosition - 1, 0, entry);

    // Update all positions
    await get().reorderWaitlist(waitlist);
  },

  submitWaitlistApplication: async (entry) => {
    // Public method - doesn't require auth
    // The userId will be set by the breeder who owns the application form
    const breederId = (entry as any).userId;
    const waitlistRef = collection(db, 'waitlist');
    const customersRef = collection(db, 'customers');

    // Get current count to set position
    // Count existing entries for this breeder using breederId
    const snapshot = await getDocs(
      query(waitlistRef, where('breederId', '==', breederId))
    );
    const position = snapshot.docs.length + 1;

    // Find or create a contact for this applicant
    let contactId: string | undefined;

    try {
      // Search for existing contact by email first
      const emailQuery = query(
        customersRef,
        where('breederId', '==', breederId),
        where('email', '==', entry.email.toLowerCase().trim())
      );
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        // Found existing contact by email
        const existingContact = emailSnapshot.docs[0];
        contactId = existingContact.id;

        // Update contact roles to include 'prospect' if not already
        const currentRoles = existingContact.data().contactRoles || [];
        if (!currentRoles.includes('prospect')) {
          await updateDoc(doc(db, 'customers', contactId), {
            contactRoles: [...currentRoles, 'prospect'],
            updatedAt: serverTimestamp(),
          });
        }
      } else if (entry.phone) {
        // Try phone match - normalize to last 10 digits
        const normalizedPhone = entry.phone.replace(/\D/g, '').slice(-10);
        if (normalizedPhone.length === 10) {
          // Query all customers for this breeder and filter in memory
          // (Firestore doesn't support partial string matching)
          const allCustomersQuery = query(
            customersRef,
            where('breederId', '==', breederId)
          );
          const allCustomersSnapshot = await getDocs(allCustomersQuery);

          for (const customerDoc of allCustomersSnapshot.docs) {
            const customerPhone = (customerDoc.data().phone || '').replace(/\D/g, '');
            if (customerPhone.slice(-10) === normalizedPhone) {
              contactId = customerDoc.id;

              // Update contact roles to include 'prospect' if not already
              const currentRoles = customerDoc.data().contactRoles || [];
              if (!currentRoles.includes('prospect')) {
                await updateDoc(doc(db, 'customers', contactId), {
                  contactRoles: [...currentRoles, 'prospect'],
                  updatedAt: serverTimestamp(),
                });
              }
              break;
            }
          }
        }
      }

      // If no existing contact found, create a new one
      if (!contactId) {
        const newCustomer = {
          name: entry.name,
          email: entry.email.toLowerCase().trim(),
          phone: entry.phone || '',
          address: entry.address || '',
          city: entry.city || '',
          state: entry.state || '',
          type: 'prospect',
          status: 'active',
          source: 'website',
          preferredContact: 'email',
          emailOptIn: true,
          smsOptIn: false,
          userId: breederId,
          breederId: breederId,
          firstContactDate: new Date().toISOString().split('T')[0],
          lastContactDate: new Date().toISOString().split('T')[0],
          totalPurchases: 0,
          totalRevenue: 0,
          lifetimeValue: 0,
          interactions: [],
          purchases: [],
          tags: [],
          contactRoles: ['prospect'],
          notes: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const newContactDoc = await addDoc(customersRef, newCustomer);
        contactId = newContactDoc.id;
      }
    } catch (error) {
      // Log error but don't fail the waitlist submission
      console.error('Error creating/linking contact for waitlist application:', error);
    }

    const newEntry = {
      ...entry,
      // Persist breederId for rules; keep userId for backward compat
      breederId: breederId,
      contactId: contactId, // Link to contact record
      status: 'pending' as const,
      position,
      applicationDate: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(waitlistRef, newEntry);
  },

  subscribeToWaitlist: () => {
    const user = auth.currentUser;
    if (!user) return () => {};

    set({ loading: true });

    const waitlistQuery = query(
      collection(db, 'waitlist'),
      where('breederId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      waitlistQuery,
      (snapshot) => {
        const waitlist: WaitlistEntry[] = snapshot.docs
          .map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as WaitlistEntry)
          )
          .sort((a, b) => (a.position || 0) - (b.position || 0)); // Sort in memory instead
        set({ waitlist, loading: false });
      },
      (error) => {
        console.error('Error subscribing to waitlist:', error);
        set({ loading: false });
      }
    );

    return unsubscribe;
  },
}));
