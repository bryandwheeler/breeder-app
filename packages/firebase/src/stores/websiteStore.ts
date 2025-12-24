import { create } from 'zustand';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { WebsiteSettings, AvailablePuppyListing } from '@breeder/types';

interface WebsiteState {
  websiteSettings: WebsiteSettings | null;
  loading: boolean;

  // Actions
  subscribeToWebsiteSettings: (userId: string) => () => void;
  getWebsiteSettings: (userId: string) => Promise<WebsiteSettings | null>;
  createWebsiteSettings: (
    userId: string,
    settings: Omit<WebsiteSettings, 'userId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateWebsiteSettings: (
    userId: string,
    settings: Partial<WebsiteSettings>
  ) => Promise<void>;
  updateTheme: (
    userId: string,
    theme: Partial<WebsiteSettings['theme']>
  ) => Promise<void>;
  addPuppyListing: (
    userId: string,
    listing: Omit<AvailablePuppyListing, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updatePuppyListing: (
    userId: string,
    listingId: string,
    listing: Partial<AvailablePuppyListing>
  ) => Promise<void>;
  deletePuppyListing: (userId: string, listingId: string) => Promise<void>;
}

const DEFAULT_THEME = {
  primaryColor: '#3b82f6',
  secondaryColor: '#1f2937',
  accentColor: '#fbbf24',
  fontFamily: 'sans' as const,
  headerStyle: 'full' as const,
};

const DEFAULT_MENU_ITEMS = [
  { label: 'Home', page: 'home', order: 1 },
  { label: 'About Us', page: 'about', order: 2 },
  { label: 'Available Puppies', page: 'puppies', order: 3 },
  { label: 'Contact', page: 'contact', order: 4 },
];

export const useWebsiteStore = create<WebsiteState>((set, get) => ({
  websiteSettings: null,
  loading: false,

  subscribeToWebsiteSettings: (userId: string) => {
    const settingsRef = doc(db, 'websiteSettings', userId);

    const unsubscribe = onSnapshot(
      settingsRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          set({ websiteSettings: snapshot.data() as WebsiteSettings });
        } else {
          // Create default settings if they don't exist
          const defaultSettings: WebsiteSettings = {
            userId,
            theme: DEFAULT_THEME,
            siteName: '',
            menuItems: DEFAULT_MENU_ITEMS,
            pages: [
              {
                id: 'about',
                title: 'About Us',
                slug: 'about',
                content: '',
                published: true,
                order: 1,
                template: 'about',
              },
              {
                id: 'contact',
                title: 'Contact Us',
                slug: 'contact',
                content: '',
                published: true,
                order: 2,
                template: 'contact',
              },
            ],
            puppyListings: [],
            enablePuppyShop: true,
            enableGallery: false,
            enableBlog: false,
            contactFormEmail: '',
            socialLinks: {},
            showPricing: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(settingsRef, defaultSettings);
          set({ websiteSettings: defaultSettings });
        }
      },
      (error) => {
        console.error('Error subscribing to website settings:', error);
      }
    );

    return unsubscribe;
  },

  getWebsiteSettings: async (userId: string) => {
    try {
      const settingsRef = doc(db, 'websiteSettings', userId);
      const snapshot = await getDoc(settingsRef);
      if (snapshot.exists()) {
        return snapshot.data() as WebsiteSettings;
      }
      return null;
    } catch (error) {
      console.error('Error getting website settings:', error);
      throw error;
    }
  },

  createWebsiteSettings: async (userId, settings) => {
    try {
      const settingsRef = doc(db, 'websiteSettings', userId);
      const newSettings: WebsiteSettings = {
        ...settings,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(settingsRef, newSettings);
      set({ websiteSettings: newSettings });
    } catch (error) {
      console.error('Error creating website settings:', error);
      throw error;
    }
  },

  updateWebsiteSettings: async (userId, settings) => {
    try {
      const settingsRef = doc(db, 'websiteSettings', userId);
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('Error updating website settings:', error);
      throw error;
    }
  },

  updateTheme: async (userId, theme) => {
    try {
      const current = get().websiteSettings;
      if (!current) throw new Error('Website settings not found');

      const settingsRef = doc(db, 'websiteSettings', userId);
      await updateDoc(settingsRef, {
        theme: { ...current.theme, ...theme },
        updatedAt: new Date().toISOString(),
      });
      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  },

  addPuppyListing: async (userId, listing) => {
    try {
      const current = get().websiteSettings;
      if (!current) throw new Error('Website settings not found');

      const newListing: AvailablePuppyListing = {
        ...listing,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const settingsRef = doc(db, 'websiteSettings', userId);
      await updateDoc(settingsRef, {
        puppyListings: [...(current.puppyListings || []), newListing],
        updatedAt: new Date().toISOString(),
      });
      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('Error adding puppy listing:', error);
      throw error;
    }
  },

  updatePuppyListing: async (userId, listingId, listing) => {
    try {
      const current = get().websiteSettings;
      if (!current) throw new Error('Website settings not found');

      const updatedListings = (current.puppyListings || []).map((p) =>
        p.id === listingId
          ? {
              ...p,
              ...listing,
              updatedAt: new Date().toISOString(),
            }
          : p
      );

      const settingsRef = doc(db, 'websiteSettings', userId);
      await updateDoc(settingsRef, {
        puppyListings: updatedListings,
        updatedAt: new Date().toISOString(),
      });
      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('Error updating puppy listing:', error);
      throw error;
    }
  },

  deletePuppyListing: async (userId, listingId) => {
    try {
      const current = get().websiteSettings;
      if (!current) throw new Error('Website settings not found');

      const filteredListings = (current.puppyListings || []).filter(
        (p) => p.id !== listingId
      );

      const settingsRef = doc(db, 'websiteSettings', userId);
      await updateDoc(settingsRef, {
        puppyListings: filteredListings,
        updatedAt: new Date().toISOString(),
      });
      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('Error deleting puppy listing:', error);
      throw error;
    }
  },
}));
