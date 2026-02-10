import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FavoriteThing } from '@breeder/types';

const COLLECTION = 'favoriteThings';

interface FavoriteThingsStore {
  items: FavoriteThing[];
  loading: boolean;
  error: string | null;

  subscribeItems: (userId: string) => () => void;
  getPublicItems: (userId: string) => Promise<FavoriteThing[]>;

  createItem: (item: Omit<FavoriteThing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateItem: (id: string, updates: Partial<FavoriteThing>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  clearError: () => void;
  reset: () => void;
}

export const useFavoriteThingsStore = create<FavoriteThingsStore>((set) => ({
  items: [],
  loading: false,
  error: null,

  subscribeItems: (userId: string) => {
    set({ loading: true, error: null });
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('category', 'asc'),
      orderBy('order', 'asc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as FavoriteThing[];
        set({ items, loading: false });
      },
      (error) => {
        console.error('Error subscribing to favorite things:', error);
        set({ error: error.message, loading: false });
      },
    );

    return unsubscribe;
  },

  getPublicItems: async (userId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        orderBy('category', 'asc'),
        orderBy('order', 'asc'),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FavoriteThing[];
    } catch (error: any) {
      console.error('Error fetching favorite things:', error);
      return [];
    }
  },

  createItem: async (itemData) => {
    try {
      set({ loading: true, error: null });
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...itemData,
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

  updateItem: async (id: string, updates: Partial<FavoriteThing>) => {
    try {
      set({ loading: true, error: null });
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  deleteItem: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ items: [], loading: false, error: null }),
}));
