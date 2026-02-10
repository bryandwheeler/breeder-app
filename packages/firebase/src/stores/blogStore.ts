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
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { BlogPost } from '@breeder/types';

const COLLECTION = 'blogPosts';

interface BlogStore {
  // State
  posts: BlogPost[];
  loading: boolean;
  error: string | null;

  // Real-time subscription (for breeder management)
  subscribePosts: (userId: string) => () => void;

  // One-time fetches (for public website)
  getPublishedPosts: (userId: string) => Promise<BlogPost[]>;
  getPostBySlug: (userId: string, slug: string) => Promise<BlogPost | null>;

  // CRUD
  createPost: (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePost: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

export const useBlogStore = create<BlogStore>((set, get) => ({
  posts: [],
  loading: false,
  error: null,

  subscribePosts: (userId: string) => {
    set({ loading: true, error: null });
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BlogPost[];
        set({ posts, loading: false });
      },
      (error) => {
        console.error('Error subscribing to blog posts:', error);
        set({ error: error.message, loading: false });
      },
    );

    return unsubscribe;
  },

  getPublishedPosts: async (userId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('published', '==', true),
        orderBy('publishedAt', 'desc'),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BlogPost[];
    } catch (error: any) {
      console.error('Error fetching published posts:', error);
      return [];
    }
  },

  getPostBySlug: async (userId: string, slug: string) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('slug', '==', slug),
        where('published', '==', true),
        limit(1),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as BlogPost;
    } catch (error: any) {
      console.error('Error fetching post by slug:', error);
      return null;
    }
  },

  createPost: async (postData) => {
    try {
      set({ loading: true, error: null });
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...postData,
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

  updatePost: async (id: string, updates: Partial<BlogPost>) => {
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

  deletePost: async (id: string) => {
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
  reset: () => set({ posts: [], loading: false, error: null }),
}));
