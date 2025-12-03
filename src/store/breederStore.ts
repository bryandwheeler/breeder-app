// Firestore-powered breeder profile and inquiry store
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
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { BreederProfile, Testimonial, Inquiry } from '@/types/dog';

type Store = {
  profile: BreederProfile | null;
  testimonials: Testimonial[];
  inquiries: Inquiry[];
  loading: boolean;

  // Profile methods
  createProfile: (profile: Omit<BreederProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProfile: (updates: Partial<BreederProfile>) => Promise<void>;
  getPublicProfile: (userId: string) => Promise<BreederProfile | null>;

  // Testimonial methods
  addTestimonial: (testimonial: Omit<Testimonial, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateTestimonial: (id: string, updates: Partial<Testimonial>) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  getPublicTestimonials: (userId: string) => Promise<Testimonial[]>;

  // Inquiry methods
  addInquiry: (inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInquiry: (id: string, updates: Partial<Inquiry>) => Promise<void>;
  deleteInquiry: (id: string) => Promise<void>;

  // Subscription
  subscribeToBreederData: () => () => void;
};

export const useBreederStore = create<Store>()((set, get) => ({
  profile: null,
  testimonials: [],
  inquiries: [],
  loading: false,

  createProfile: async (profile) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to create profile');

    const profilesRef = collection(db, 'breeder_profiles');
    const newProfile = {
      ...profile,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(profilesRef, newProfile);
  },

  updateProfile: async (updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update profile');

    const { profile } = get();
    if (!profile) throw new Error('No profile found');

    const profileRef = doc(db, 'breeder_profiles', profile.id);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  getPublicProfile: async (userId: string) => {
    const profilesQuery = query(
      collection(db, 'breeder_profiles'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(profilesQuery);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as BreederProfile;
  },

  addTestimonial: async (testimonial) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add testimonials');

    const testimonialsRef = collection(db, 'testimonials');
    const newTestimonial = {
      ...testimonial,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    await addDoc(testimonialsRef, newTestimonial);
  },

  updateTestimonial: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update testimonials');

    const testimonialRef = doc(db, 'testimonials', id);
    await updateDoc(testimonialRef, updates);
  },

  deleteTestimonial: async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete testimonials');

    const testimonialRef = doc(db, 'testimonials', id);
    await deleteDoc(testimonialRef);
  },

  getPublicTestimonials: async (userId: string) => {
    const testimonialsQuery = query(
      collection(db, 'testimonials'),
      where('userId', '==', userId),
      where('approved', '==', true)
    );

    const snapshot = await getDocs(testimonialsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Testimonial[];
  },

  addInquiry: async (inquiry) => {
    const inquiriesRef = collection(db, 'inquiries');
    const newInquiry = {
      ...inquiry,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(inquiriesRef, newInquiry);
  },

  updateInquiry: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update inquiries');

    const inquiryRef = doc(db, 'inquiries', id);
    await updateDoc(inquiryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteInquiry: async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete inquiries');

    const inquiryRef = doc(db, 'inquiries', id);
    await deleteDoc(inquiryRef);
  },

  subscribeToBreederData: () => {
    const user = auth.currentUser;
    if (!user) return () => {};

    set({ loading: true });

    // Subscribe to profile
    const profileQuery = query(
      collection(db, 'breeder_profiles'),
      where('userId', '==', user.uid)
    );

    const unsubscribeProfile = onSnapshot(
      profileQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const profile = { id: doc.id, ...doc.data() } as BreederProfile;
          set({ profile, loading: false });
        } else {
          set({ profile: null, loading: false });
        }
      },
      (error) => {
        console.error('Error loading profile:', error);
        set({ loading: false });
      }
    );

    // Subscribe to testimonials
    const testimonialsQuery = query(
      collection(db, 'testimonials'),
      where('userId', '==', user.uid)
    );

    const unsubscribeTestimonials = onSnapshot(
      testimonialsQuery,
      (snapshot) => {
        const testimonials: Testimonial[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Testimonial));
        set({ testimonials });
      },
      (error) => {
        console.error('Error loading testimonials:', error);
      }
    );

    // Subscribe to inquiries
    const inquiriesQuery = query(
      collection(db, 'inquiries'),
      where('userId', '==', user.uid)
    );

    const unsubscribeInquiries = onSnapshot(
      inquiriesQuery,
      (snapshot) => {
        const inquiries: Inquiry[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            lastContactDate: data.lastContactDate?.toDate?.()?.toISOString() || data.lastContactDate,
            nextFollowUpDate: data.nextFollowUpDate?.toDate?.()?.toISOString() || data.nextFollowUpDate,
          } as Inquiry;
        });
        set({ inquiries });
      },
      (error) => {
        console.error('Error loading inquiries:', error);
      }
    );

    // Return cleanup function
    return () => {
      unsubscribeProfile();
      unsubscribeTestimonials();
      unsubscribeInquiries();
    };
  },
}));
