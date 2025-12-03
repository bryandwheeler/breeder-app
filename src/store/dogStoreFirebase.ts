// Firestore-powered dog store
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
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Dog, NewDog, Litter } from '@/types/dog';
import { differenceInDays } from 'date-fns';

// Calculate litter status based on dates
function calculateLitterStatus(litter: Litter): Litter['status'] {
  if (!litter.dateOfBirth) return litter.status || 'planned';

  const today = new Date();
  const dob = new Date(litter.dateOfBirth);
  const daysSinceBirth = differenceInDays(today, dob);

  // If DOB is in the future, check if pregnant
  if (daysSinceBirth < 0) {
    return litter.status === 'pregnant' ? 'pregnant' : 'planned';
  }

  // Check pickup ready date first
  if (litter.pickupReadyDate) {
    const readyDate = new Date(litter.pickupReadyDate);
    if (today >= readyDate) {
      // Check if all puppies are sold/kept
      const puppies = litter.puppies || [];
      const allPlaced =
        puppies.length > 0 &&
        puppies.every((p) => p.status === 'sold' || p.status === 'kept');
      if (allPlaced) return 'completed';
      return 'ready';
    }
  }

  // Auto-progress based on age (typical milestones)
  if (daysSinceBirth >= 56) return 'ready'; // 8 weeks
  if (daysSinceBirth >= 21) return 'weaning'; // 3 weeks
  if (daysSinceBirth >= 0) return 'born';

  return litter.status || 'planned';
}

type Store = {
  dogs: Dog[];
  litters: Litter[];
  loading: boolean;
  addDog: (dog: NewDog, targetUid?: string) => Promise<string>; // Returns the new dog's ID
  updateDog: (id: string, updates: Partial<Dog>) => Promise<void>;
  deleteDog: (id: string) => Promise<void>;
  addLitter: (litter: Omit<Litter, 'id'>, targetUid?: string) => Promise<void>;
  updateLitter: (id: string, updates: Partial<Litter>) => Promise<void>;
  deleteLitter: (id: string) => Promise<void>;
  subscribeToUserData: (targetUid?: string) => () => void;
};

export const useDogStore = create<Store>()((set, get) => ({
  dogs: [],
  litters: [],
  loading: false,

  addDog: async (dog, targetUid) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add dogs');

    const dogsRef = collection(db, 'dogs');
    const newDog = {
      ...dog,
      userId: targetUid || user.uid,
      photos: dog.photos || [],
      healthTests: dog.healthTests || [],
      shotRecords: dog.shotRecords || [],
      reminders: dog.reminders || [],
      weightHistory: dog.weightHistory || [],
      medications: dog.medications || [],
      dewormings: dog.dewormings || [],
      vetVisits: dog.vetVisits || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(dogsRef, newDog);
    return docRef.id; // Return the new dog's ID
  },

  updateDog: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update dogs');

    const dogRef = doc(db, 'dogs', id);
    await updateDoc(dogRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteDog: async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete dogs');

    const dogRef = doc(db, 'dogs', id);
    await deleteDoc(dogRef);
  },

  addLitter: async (litter, targetUid) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add litters');

    const littersRef = collection(db, 'litters');
    const newLitter = {
      ...litter,
      userId: targetUid || user.uid,
      puppies: litter.puppies || [],
      buyers: litter.buyers || [],
      status: litter.status || 'planned',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(littersRef, newLitter);
  },

  updateLitter: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update litters');

    const litterRef = doc(db, 'litters', id);
    await updateDoc(litterRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteLitter: async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete litters');

    const litterRef = doc(db, 'litters', id);
    await deleteDoc(litterRef);
  },

  subscribeToUserData: (targetUid?: string) => {
    const user = auth.currentUser;
    const uid = targetUid || user?.uid;
    if (!uid) return () => {};

    set({ loading: true });

    // Subscribe to user's dogs
    const dogsQuery = query(collection(db, 'dogs'), where('userId', '==', uid));

    const unsubscribeDogs = onSnapshot(
      dogsQuery,
      (snapshot) => {
        const dogs: Dog[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Dog)
        );
        set({ dogs, loading: false });
      },
      (error) => {
        console.error('[dogStore] Dogs snapshot error:', error);
        // Gracefully handle permission-denied without crashing UI
        set({ loading: false });
      }
    );

    // Subscribe to user's litters
    const littersQuery = query(
      collection(db, 'litters'),
      where('userId', '==', uid)
    );

    const unsubscribeLitters = onSnapshot(
      littersQuery,
      (snapshot) => {
        const litters: Litter[] = snapshot.docs.map((doc) => {
          const data = doc.data() as Omit<Litter, 'id'>;
          const litter = { id: doc.id, ...data } as Litter;
          // Auto-calculate status based on dates
          litter.status = calculateLitterStatus(litter);
          return litter;
        });
        set({ litters });
      },
      (error) => {
        console.error('[dogStore] Litters snapshot error:', error);
        // Keep UI responsive even if listener is denied
        set({ loading: false });
      }
    );

    // Return cleanup function
    return () => {
      unsubscribeDogs();
      unsubscribeLitters();
    };
  },
}));
