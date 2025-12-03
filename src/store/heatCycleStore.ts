// Firestore-powered heat cycle and breeding store
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
import { db, auth } from '@/lib/firebase';
import { HeatCycle, BreedingRecord } from '@/types/dog';

type Store = {
  heatCycles: HeatCycle[];
  breedingRecords: BreedingRecord[];
  loading: boolean;

  // Heat Cycle methods
  addHeatCycle: (cycle: Omit<HeatCycle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHeatCycle: (id: string, updates: Partial<HeatCycle>) => Promise<void>;
  deleteHeatCycle: (id: string) => Promise<void>;
  getHeatCyclesForDog: (dogId: string) => HeatCycle[];

  // Breeding Record methods
  addBreedingRecord: (record: Omit<BreedingRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBreedingRecord: (id: string, updates: Partial<BreedingRecord>) => Promise<void>;
  deleteBreedingRecord: (id: string) => Promise<void>;
  getBreedingRecordsForCycle: (heatCycleId: string) => BreedingRecord[];
  getBreedingRecordsForDog: (dogId: string) => BreedingRecord[];

  // Subscription
  subscribeToHeatCycles: () => () => void;
};

export const useHeatCycleStore = create<Store>()((set, get) => ({
  heatCycles: [],
  breedingRecords: [],
  loading: false,

  addHeatCycle: async (cycle) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add heat cycles');

    const heatCyclesRef = collection(db, 'heat_cycles');

    const newCycle = {
      ...cycle,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(heatCyclesRef, newCycle);
  },

  updateHeatCycle: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update heat cycles');

    const cycleRef = doc(db, 'heat_cycles', id);
    await updateDoc(cycleRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteHeatCycle: async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete heat cycles');

    // First delete all breeding records for this cycle
    const breedingRecords = get().getBreedingRecordsForCycle(id);
    for (const record of breedingRecords) {
      await deleteDoc(doc(db, 'breeding_records', record.id));
    }

    // Then delete the heat cycle
    const cycleRef = doc(db, 'heat_cycles', id);
    await deleteDoc(cycleRef);
  },

  getHeatCyclesForDog: (dogId) => {
    return get()
      .heatCycles.filter((cycle) => cycle.dogId === dogId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  },

  addBreedingRecord: async (record) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add breeding records');

    const breedingRecordsRef = collection(db, 'breeding_records');

    const newRecord = {
      ...record,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(breedingRecordsRef, newRecord);
  },

  updateBreedingRecord: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update breeding records');

    const recordRef = doc(db, 'breeding_records', id);
    await updateDoc(recordRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteBreedingRecord: async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete breeding records');

    const recordRef = doc(db, 'breeding_records', id);
    await deleteDoc(recordRef);
  },

  getBreedingRecordsForCycle: (heatCycleId) => {
    return get()
      .breedingRecords.filter((record) => record.heatCycleId === heatCycleId)
      .sort((a, b) => new Date(b.breedingDate).getTime() - new Date(a.breedingDate).getTime());
  },

  getBreedingRecordsForDog: (dogId) => {
    return get()
      .breedingRecords.filter((record) => record.dogId === dogId)
      .sort((a, b) => new Date(b.breedingDate).getTime() - new Date(a.breedingDate).getTime());
  },

  subscribeToHeatCycles: () => {
    const user = auth.currentUser;
    if (!user) return () => {};

    set({ loading: true });

    // Subscribe to heat cycles
    const heatCyclesQuery = query(
      collection(db, 'heat_cycles'),
      where('userId', '==', user.uid)
    );

    const unsubscribeHeatCycles = onSnapshot(
      heatCyclesQuery,
      (snapshot) => {
        const heatCycles: HeatCycle[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as HeatCycle));
        set({ heatCycles, loading: false });
      },
      (error) => {
        console.error('Error subscribing to heat cycles:', error);
        set({ loading: false });
      }
    );

    // Subscribe to breeding records
    const breedingRecordsQuery = query(
      collection(db, 'breeding_records'),
      where('userId', '==', user.uid)
    );

    const unsubscribeBreedingRecords = onSnapshot(
      breedingRecordsQuery,
      (snapshot) => {
        const breedingRecords: BreedingRecord[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as BreedingRecord));
        set({ breedingRecords });
      },
      (error) => {
        console.error('Error subscribing to breeding records:', error);
      }
    );

    // Return cleanup function
    return () => {
      unsubscribeHeatCycles();
      unsubscribeBreedingRecords();
    };
  },
}));
