import { create } from 'zustand';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import type { TpwIntegrationSettings, TpwWebhookDelivery } from '@breeder/types';

interface TpwIntegrationState {
  settings: TpwIntegrationSettings | null;
  recentDeliveries: TpwWebhookDelivery[];
  loading: boolean;

  subscribeToSettings: (userId: string) => () => void;
  loadRecentDeliveries: (userId: string) => Promise<void>;
  generateApiKey: () => Promise<{ apiKey: string; apiKeyPrefix: string; webhookSecret: string }>;
  revokeApiKey: () => Promise<void>;
  updateSettings: (updates: Partial<TpwIntegrationSettings>) => Promise<void>;
}

export const useTpwIntegrationStore = create<TpwIntegrationState>((set) => ({
  settings: null,
  recentDeliveries: [],
  loading: false,

  subscribeToSettings: (userId: string) => {
    set({ loading: true });
    const ref = doc(db, 'tpwIntegrations', userId);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        set({ settings: snapshot.data() as TpwIntegrationSettings, loading: false });
      } else {
        set({ settings: null, loading: false });
      }
    });
    return unsubscribe;
  },

  loadRecentDeliveries: async (userId: string) => {
    const q = query(
      collection(db, 'tpwWebhookDeliveries'),
      where('breederId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10),
    );
    const snap = await getDocs(q);
    const deliveries = snap.docs.map(d => ({ id: d.id, ...d.data() } as TpwWebhookDelivery));
    set({ recentDeliveries: deliveries });
  },

  generateApiKey: async () => {
    const fn = httpsCallable<void, { apiKey: string; apiKeyPrefix: string; webhookSecret: string }>(
      functions,
      'tpwGenerateApiKey',
    );
    const result = await fn();
    return result.data;
  },

  revokeApiKey: async () => {
    const fn = httpsCallable(functions, 'tpwRevokeApiKey');
    await fn();
  },

  updateSettings: async (updates) => {
    const fn = httpsCallable(functions, 'tpwUpdateSettings');
    await fn(updates);
  },
}));
