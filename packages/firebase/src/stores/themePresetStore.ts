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
    name: 'Warm & Classic',
    description: 'Rich warm tones with timeless serif elegance',
    category: 'professional',
    theme: {
      primaryColor: '#2c2825',
      secondaryColor: '#8c7e72',
      accentColor: '#c67a54',
      fontFamily: 'serif',
      headerStyle: 'minimal',
    },
    isPremium: false,
    order: 1,
    isActive: true,
  },
  {
    id: 'modern-breeder',
    name: 'Clean & Modern',
    description: 'Crisp slate tones with a bold blue accent',
    category: 'modern',
    theme: {
      primaryColor: '#1e293b',
      secondaryColor: '#64748b',
      accentColor: '#3b82f6',
      fontFamily: 'sans',
      headerStyle: 'minimal',
    },
    isPremium: false,
    order: 2,
    isActive: true,
  },
  {
    id: 'playful-pups',
    name: 'Soft & Playful',
    description: 'Plum and lavender with a warm coral pop',
    category: 'playful',
    theme: {
      primaryColor: '#5b4a6a',
      secondaryColor: '#9a8eb0',
      accentColor: '#f08080',
      fontFamily: 'modern',
      headerStyle: 'centered',
    },
    isPremium: false,
    order: 3,
    isActive: true,
  },
  {
    id: 'luxury-lineage',
    name: 'Elegant & Refined',
    description: 'Deep navy with polished gold accents',
    category: 'elegant',
    theme: {
      primaryColor: '#0f172a',
      secondaryColor: '#334155',
      accentColor: '#d4a853',
      fontFamily: 'elegant',
      headerStyle: 'overlay',
    },
    isPremium: true,
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
