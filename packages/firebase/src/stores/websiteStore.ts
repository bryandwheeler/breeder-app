import { create } from 'zustand';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  WebsiteSettings,
  AvailablePuppyListing,
  DomainSettings,
  SeoSettings,
  WebsiteTheme,
  RESERVED_SUBDOMAINS,
  Puppy,
  Litter,
} from '@breeder/types';

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

  // Domain management
  checkSubdomainAvailability: (subdomain: string) => Promise<boolean>;
  claimSubdomain: (userId: string, subdomain: string) => Promise<void>;
  updateDomainSettings: (
    userId: string,
    domain: Partial<DomainSettings>
  ) => Promise<void>;

  // SEO management
  updateSeoSettings: (userId: string, seo: Partial<SeoSettings>) => Promise<void>;

  // Theme preset
  applyThemePreset: (userId: string, presetId: string, theme: WebsiteTheme) => Promise<void>;

  // Publishing
  publishWebsite: (userId: string) => Promise<void>;
  unpublishWebsite: (userId: string) => Promise<void>;

  // Puppy listings
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

  // Puppy-to-website sync
  syncPuppyToWebsite: (userId: string, litter: Litter, puppy: Puppy, breed?: string) => Promise<void>;
  removePuppyFromWebsite: (userId: string, puppyId: string) => Promise<void>;

  // Public lookup
  getWebsiteBySubdomain: (subdomain: string) => Promise<WebsiteSettings | null>;
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
            websiteEnabled: false,
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

  // Domain management methods
  checkSubdomainAvailability: async (subdomain: string) => {
    try {
      // Normalize subdomain
      const normalized = subdomain.toLowerCase().trim();

      // Check reserved words
      if (RESERVED_SUBDOMAINS.includes(normalized)) {
        return false;
      }

      // Validate format (alphanumeric and hyphens only, 3-30 chars)
      const validFormat = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
      if (!validFormat.test(normalized) && normalized.length < 3) {
        return false;
      }

      // Check if subdomain is already claimed
      const domainsRef = collection(db, 'domains');
      const q = query(
        domainsRef,
        where('subdomain', '==', normalized),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);

      return snapshot.empty;
    } catch (error) {
      console.error('[websiteStore] Error checking subdomain availability:', error);
      throw error;
    }
  },

  claimSubdomain: async (userId: string, subdomain: string) => {
    try {
      const normalized = subdomain.toLowerCase().trim();

      // Double-check availability
      const isAvailable = await get().checkSubdomainAvailability(normalized);
      if (!isAvailable) {
        throw new Error('Subdomain is not available');
      }

      const now = new Date().toISOString();

      // Create domain record
      const domainRef = doc(db, 'domains', `${userId}_subdomain`);
      await setDoc(domainRef, {
        userId,
        subdomain: normalized,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });

      // Update website settings with domain info
      const domainSettings: DomainSettings = {
        subdomain: normalized,
        subdomainAvailable: true,
        subdomainClaimedAt: now,
        cnameTarget: 'websites.expertbreeder.com',
      };

      await get().updateDomainSettings(userId, domainSettings);
    } catch (error) {
      console.error('[websiteStore] Error claiming subdomain:', error);
      throw error;
    }
  },

  updateDomainSettings: async (userId: string, domain: Partial<DomainSettings>) => {
    try {
      const current = get().websiteSettings;
      const settingsRef = doc(db, 'websiteSettings', userId);

      // Filter out undefined values (Firestore doesn't accept undefined)
      const cleanedDomain = Object.fromEntries(
        Object.entries(domain).filter(([, value]) => value !== undefined)
      );

      // Merge with existing domain settings
      const mergedDomain = current?.domain
        ? { ...current.domain, ...cleanedDomain }
        : cleanedDomain;

      await updateDoc(settingsRef, {
        domain: mergedDomain,
        updatedAt: new Date().toISOString(),
      });

      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('[websiteStore] Error updating domain settings:', error);
      throw error;
    }
  },

  // SEO management
  updateSeoSettings: async (userId: string, seo: Partial<SeoSettings>) => {
    try {
      const current = get().websiteSettings;
      const settingsRef = doc(db, 'websiteSettings', userId);

      await updateDoc(settingsRef, {
        seo: current?.seo ? { ...current.seo, ...seo } : seo,
        updatedAt: new Date().toISOString(),
      });

      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('[websiteStore] Error updating SEO settings:', error);
      throw error;
    }
  },

  // Theme preset
  applyThemePreset: async (userId: string, presetId: string, theme: WebsiteTheme) => {
    try {
      const settingsRef = doc(db, 'websiteSettings', userId);

      await updateDoc(settingsRef, {
        theme,
        appliedPresetId: presetId,
        updatedAt: new Date().toISOString(),
      });

      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('[websiteStore] Error applying theme preset:', error);
      throw error;
    }
  },

  // Publishing
  publishWebsite: async (userId: string) => {
    try {
      const settingsRef = doc(db, 'websiteSettings', userId);
      const now = new Date().toISOString();

      await updateDoc(settingsRef, {
        websiteEnabled: true,
        publishedAt: now,
        updatedAt: now,
      });

      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('[websiteStore] Error publishing website:', error);
      throw error;
    }
  },

  unpublishWebsite: async (userId: string) => {
    try {
      const settingsRef = doc(db, 'websiteSettings', userId);

      await updateDoc(settingsRef, {
        websiteEnabled: false,
        updatedAt: new Date().toISOString(),
      });

      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('[websiteStore] Error unpublishing website:', error);
      throw error;
    }
  },

  // Puppy-to-website sync: creates/updates an AvailablePuppyListing from a Puppy
  syncPuppyToWebsite: async (userId: string, litter: Litter, puppy: Puppy, breed?: string) => {
    try {
      const current = get().websiteSettings || await get().getWebsiteSettings(userId);
      if (!current) throw new Error('Website settings not found');

      const now = new Date().toISOString();
      const existingListings = current.puppyListings || [];
      const existingIndex = existingListings.findIndex((l) => l.id === puppy.id);

      const listing: AvailablePuppyListing = {
        id: puppy.id,
        litterId: litter.id,
        name: puppy.name || puppy.tempName || 'Unnamed Puppy',
        breed: breed || '',
        gender: puppy.sex,
        dateOfBirth: litter.dateOfBirth,
        description: puppy.websiteDescription || '',
        price: puppy.websitePrice || puppy.salePrice || 0,
        photos: (() => {
          const selected = puppy.websitePhotos && puppy.websitePhotos.length > 0
            ? puppy.websitePhotos
            : puppy.photos || [];
          // Put primary photo first if set
          if (puppy.websitePrimaryPhoto && selected.includes(puppy.websitePrimaryPhoto)) {
            return [puppy.websitePrimaryPhoto, ...selected.filter((p) => p !== puppy.websitePrimaryPhoto)];
          }
          return selected;
        })(),
        available: puppy.status === 'available' || puppy.status === 'pending',
        reserved: puppy.status === 'reserved',
        featured: puppy.websiteFeatured || false,
        createdAt: existingIndex >= 0 ? existingListings[existingIndex].createdAt : now,
        updatedAt: now,
      };

      let updatedListings: AvailablePuppyListing[];
      if (existingIndex >= 0) {
        updatedListings = existingListings.map((l) => l.id === puppy.id ? listing : l);
      } else {
        updatedListings = [...existingListings, listing];
      }

      const settingsRef = doc(db, 'websiteSettings', userId);
      await updateDoc(settingsRef, {
        puppyListings: updatedListings,
        updatedAt: now,
      });
      const updated = await get().getWebsiteSettings(userId);
      if (updated) {
        set({ websiteSettings: updated });
      }
    } catch (error) {
      console.error('[websiteStore] Error syncing puppy to website:', error);
      throw error;
    }
  },

  removePuppyFromWebsite: async (userId: string, puppyId: string) => {
    try {
      const current = get().websiteSettings || await get().getWebsiteSettings(userId);
      if (!current) throw new Error('Website settings not found');

      const filteredListings = (current.puppyListings || []).filter(
        (l) => l.id !== puppyId
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
      console.error('[websiteStore] Error removing puppy from website:', error);
      throw error;
    }
  },

  // Public lookup by subdomain
  getWebsiteBySubdomain: async (subdomain: string) => {
    try {
      const normalized = subdomain.toLowerCase().trim();

      // Find the domain record
      const domainsRef = collection(db, 'domains');
      const q = query(
        domainsRef,
        where('subdomain', '==', normalized),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const domainDoc = snapshot.docs[0];
      const userId = domainDoc.data().userId;

      // Get the website settings
      const settings = await get().getWebsiteSettings(userId);

      // Only return if website is enabled
      if (settings?.websiteEnabled) {
        return settings;
      }

      return null;
    } catch (error) {
      console.error('[websiteStore] Error getting website by subdomain:', error);
      throw error;
    }
  },
}));
