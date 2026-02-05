import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ThemePreset, WebsiteTheme } from '@breeder/types';

interface ThemePresetState {
  presets: ThemePreset[];
  loading: boolean;

  // Actions
  subscribeToPresets: () => () => void;
  getPresetById: (id: string) => ThemePreset | undefined;
  getPresetsByCategory: (category: ThemePreset['category']) => ThemePreset[];
  getBasicPresets: () => ThemePreset[];
  getPremiumPresets: () => ThemePreset[];
}

// Default theme presets to seed
export const DEFAULT_THEME_PRESETS: Omit<ThemePreset, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'classic-kennel',
    name: 'Classic Kennel',
    description: 'Professional and trustworthy with warm earth tones',
    category: 'professional',
    theme: {
      primaryColor: '#8B4513', // Saddle brown
      secondaryColor: '#2F4F4F', // Dark slate gray
      accentColor: '#D2691E', // Chocolate
      fontFamily: 'serif',
      headerStyle: 'full',
    },
    isPremium: false,
    order: 1,
    isActive: true,
  },
  {
    id: 'modern-breeder',
    name: 'Modern Breeder',
    description: 'Clean and contemporary with a professional feel',
    category: 'modern',
    theme: {
      primaryColor: '#3B82F6', // Blue
      secondaryColor: '#1F2937', // Gray 800
      accentColor: '#10B981', // Emerald
      fontFamily: 'sans',
      headerStyle: 'minimal',
    },
    isPremium: false,
    order: 2,
    isActive: true,
  },
  {
    id: 'playful-pups',
    name: 'Playful Pups',
    description: 'Fun and friendly with warm inviting colors',
    category: 'playful',
    theme: {
      primaryColor: '#F59E0B', // Amber
      secondaryColor: '#7C3AED', // Violet
      accentColor: '#EC4899', // Pink
      fontFamily: 'playful',
      headerStyle: 'banner',
    },
    isPremium: false,
    order: 3,
    isActive: true,
  },
  {
    id: 'luxury-lineage',
    name: 'Luxury Lineage',
    description: 'Sophisticated and elegant for premium breeders',
    category: 'elegant',
    theme: {
      primaryColor: '#0B2E4E', // Navy
      secondaryColor: '#1F2937', // Charcoal
      accentColor: '#D4AF37', // Gold
      fontFamily: 'luxury',
      headerStyle: 'overlay',
    },
    isPremium: true, // Pro only
    order: 4,
    isActive: true,
  },
];

export const useThemePresetStore = create<ThemePresetState>((set, get) => ({
  presets: [],
  loading: false,

  subscribeToPresets: () => {
    set({ loading: true });

    const presetsQuery = query(
      collection(db, 'themePresets'),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(
      presetsQuery,
      (snapshot) => {
        const presets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ThemePreset[];
        set({ presets, loading: false });
      },
      (error) => {
        console.error('[themePresetStore] Error subscribing to presets:', error);
        set({ loading: false });
      }
    );

    return unsubscribe;
  },

  getPresetById: (id: string) => {
    return get().presets.find((preset) => preset.id === id);
  },

  getPresetsByCategory: (category: ThemePreset['category']) => {
    return get().presets.filter((preset) => preset.category === category);
  },

  getBasicPresets: () => {
    return get().presets.filter((preset) => !preset.isPremium);
  },

  getPremiumPresets: () => {
    return get().presets.filter((preset) => preset.isPremium);
  },
}));

// Helper function to seed initial presets (admin use only)
export async function seedThemePresets(): Promise<void> {
  const presetsRef = collection(db, 'themePresets');
  const existing = await getDocs(presetsRef);

  // Only seed if collection is empty
  if (!existing.empty) {
    console.log('[themePresetStore] Theme presets already exist, skipping seed');
    return;
  }

  console.log('[themePresetStore] Seeding default theme presets...');
  const now = new Date().toISOString();

  for (const preset of DEFAULT_THEME_PRESETS) {
    const presetRef = doc(db, 'themePresets', preset.id);
    await setDoc(presetRef, {
      ...preset,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log('[themePresetStore] Seeded', DEFAULT_THEME_PRESETS.length, 'theme presets');
}
