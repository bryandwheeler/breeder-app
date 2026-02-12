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
    name: 'Slate & Amber',
    description: 'Clean charcoal with a warm amber accent',
    category: 'professional',
    theme: {
      primaryColor: '#1e293b',
      secondaryColor: '#64748b',
      accentColor: '#d97706',
      fontFamily: 'serif',
      headerStyle: 'minimal',
    },
    isPremium: false,
    order: 1,
    isActive: true,
  },
  {
    id: 'modern-breeder',
    name: 'Bold & Blue',
    description: 'Deep navy fading into vivid royal blue',
    category: 'modern',
    theme: {
      primaryColor: '#0f172a',
      secondaryColor: '#1d4ed8',
      accentColor: '#06b6d4',
      fontFamily: 'sans',
      headerStyle: 'minimal',
    },
    isPremium: false,
    order: 2,
    isActive: true,
  },
  {
    id: 'playful-pups',
    name: 'Teal & Sunshine',
    description: 'Friendly teal with a cheerful golden accent',
    category: 'playful',
    theme: {
      primaryColor: '#0e7490',
      secondaryColor: '#67e8f9',
      accentColor: '#f59e0b',
      fontFamily: 'modern',
      headerStyle: 'centered',
    },
    isPremium: false,
    order: 3,
    isActive: true,
  },
  {
    id: 'forest-sage',
    name: 'Natural & Fresh',
    description: 'Deep forest greens with golden honey warmth',
    category: 'professional',
    theme: {
      primaryColor: '#14281d',
      secondaryColor: '#4d7c5e',
      accentColor: '#d4a053',
      fontFamily: 'sans',
      headerStyle: 'minimal',
    },
    isPremium: false,
    order: 4,
    isActive: true,
  },
  {
    id: 'charcoal-coral',
    name: 'Minimal & Coral',
    description: 'Clean neutrals with a vibrant coral accent',
    category: 'modern',
    theme: {
      primaryColor: '#18181b',
      secondaryColor: '#52525b',
      accentColor: '#fb7185',
      fontFamily: 'sans',
      headerStyle: 'minimal',
    },
    isPremium: false,
    order: 5,
    isActive: true,
  },
  {
    id: 'luxury-lineage',
    name: 'Noir & Gold',
    description: 'Jet-black elegance with champagne gold shimmer',
    category: 'elegant',
    theme: {
      primaryColor: '#09090b',
      secondaryColor: '#3f3f46',
      accentColor: '#d4a853',
      fontFamily: 'elegant',
      headerStyle: 'overlay',
    },
    isPremium: true,
    order: 6,
    isActive: true,
  },
  {
    id: 'coastal-teal',
    name: 'Cool & Coastal',
    description: 'Ocean depths with fresh mint and seafoam',
    category: 'modern',
    theme: {
      primaryColor: '#0c1f2e',
      secondaryColor: '#1a6b78',
      accentColor: '#2dd4bf',
      fontFamily: 'sans',
      headerStyle: 'minimal',
    },
    isPremium: true,
    order: 7,
    isActive: true,
  },
  {
    id: 'blush-plum',
    name: 'Soft & Romantic',
    description: 'Deep plum elegance with soft blush tones',
    category: 'elegant',
    theme: {
      primaryColor: '#4a1942',
      secondaryColor: '#a35b8f',
      accentColor: '#f0abbc',
      fontFamily: 'elegant',
      headerStyle: 'centered',
    },
    isPremium: true,
    order: 8,
    isActive: true,
  },
  {
    id: 'bordeaux-ivory',
    name: 'Bordeaux & Ivory',
    description: 'Warm charcoal with a rich wine-red accent',
    category: 'elegant',
    theme: {
      primaryColor: '#1c1917',
      secondaryColor: '#a8a29e',
      accentColor: '#9f1239',
      fontFamily: 'elegant',
      headerStyle: 'minimal',
    },
    isPremium: true,
    order: 9,
    isActive: true,
  },
  {
    id: 'midnight-emerald',
    name: 'Midnight Emerald',
    description: 'Deep jewel greens with a golden highlight',
    category: 'elegant',
    theme: {
      primaryColor: '#022c22',
      secondaryColor: '#065f46',
      accentColor: '#fbbf24',
      fontFamily: 'elegant',
      headerStyle: 'overlay',
    },
    isPremium: true,
    order: 10,
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
