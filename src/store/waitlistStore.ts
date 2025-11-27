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
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { WaitlistEntry } from '@/types/dog';

type Store = {
  waitlist: WaitlistEntry[];
  loading: boolean;

  // Waitlist methods
  addToWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWaitlistEntry: (id: string, updates: Partial<WaitlistEntry>) => Promise<void>;
  deleteWaitlistEntry: (id: string) => Promise<void>;
  reorderWaitlist: (entries: WaitlistEntry[]) => Promise<void>;
  moveToPosition: (id: string, newPosition: number) => Promise<void>;

  // Public methods (for waitlist application form)
  submitWaitlistApplication: (entry: Omit<WaitlistEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;

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
      userId: user.uid,
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
    const remainingEntries = get().waitlist
      .filter((e) => e.id !== id && (e.status === 'active' || e.status === 'approved'))
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

    const waitlist = get().waitlist
      .filter((e) => e.status === 'active' || e.status === 'approved')
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
    const waitlistRef = collection(db, 'waitlist');

    // Get current count to set position
    const snapshot = await getDocs(query(
      waitlistRef,
      where('userId', '==', entry.userId)
    ));
    const position = snapshot.docs.length + 1;

    const newEntry = {
      ...entry,
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
    if (!user) {
      console.log('No user logged in');
      return () => {};
    }

    console.log('Subscribing to waitlist for user:', user.uid);
    set({ loading: true });

    const waitlistQuery = query(
      collection(db, 'waitlist'),
      where('userId', '==', user.uid),
      orderBy('position', 'asc')
    );

    const unsubscribe = onSnapshot(
      waitlistQuery,
      (snapshot) => {
        console.log('Waitlist snapshot received:', snapshot.docs.length, 'documents');
        const waitlist: WaitlistEntry[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as WaitlistEntry));
        console.log('Waitlist entries:', waitlist);
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
