// Contract Store - Zustand store for managing SignNow e-signature contracts
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
  getDocs,
  orderBy,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import {
  SignNowContract,
  SignNowContractTemplate,
  ContractSigner,
  ContractAuditEvent,
  ContractStatus,
  ContractTemplateType,
} from '@breeder/types';

interface ContractStore {
  // State
  contracts: SignNowContract[];
  templates: SignNowContractTemplate[];
  currentContract: SignNowContract | null;
  currentContractSigners: ContractSigner[];
  currentContractAuditEvents: ContractAuditEvent[];
  loading: boolean;
  error: string | null;

  // Contract Actions
  createContract: (data: Omit<SignNowContract, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateContract: (contractId: string, data: Partial<SignNowContract>) => Promise<void>;
  deleteContract: (contractId: string) => Promise<void>;
  cancelContract: (contractId: string) => Promise<void>;

  // Signer Actions
  addSigner: (contractId: string, signer: Omit<ContractSigner, 'id'>) => Promise<string>;
  updateSigner: (contractId: string, signerId: string, data: Partial<ContractSigner>) => Promise<void>;
  removeSigner: (contractId: string, signerId: string) => Promise<void>;

  // Template Actions
  createTemplate: (data: Omit<SignNowContractTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTemplate: (templateId: string, data: Partial<SignNowContractTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;

  // Subscriptions
  subscribeToContracts: (userId: string) => () => void;
  subscribeToContract: (contractId: string) => () => void;
  subscribeToContractSigners: (contractId: string) => () => void;
  subscribeToContractAuditEvents: (contractId: string) => () => void;
  subscribeToTemplates: (userId: string) => () => void;

  // Queries
  getContractById: (contractId: string) => Promise<SignNowContract | null>;
  getContractsByStatus: (userId: string, status: ContractStatus) => Promise<SignNowContract[]>;
  getContractsByPuppy: (puppyId: string) => Promise<SignNowContract[]>;
  getTemplateById: (templateId: string) => Promise<SignNowContractTemplate | null>;

  // Utility
  setCurrentContract: (contract: SignNowContract | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Helper to convert Firestore timestamp to ISO string
const toISOString = (timestamp: unknown): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString();
};

// Helper to convert Firestore doc to Contract
const docToContract = (docSnap: { id: string; data: () => Record<string, unknown> }): SignNowContract => {
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: toISOString(data.createdAt),
    updatedAt: toISOString(data.updatedAt),
    sentAt: data.sentAt ? toISOString(data.sentAt) : undefined,
    expiresAt: data.expiresAt ? toISOString(data.expiresAt) : undefined,
    completedAt: data.completedAt ? toISOString(data.completedAt) : undefined,
    cancelledAt: data.cancelledAt ? toISOString(data.cancelledAt) : undefined,
  } as SignNowContract;
};

// Helper to convert Firestore doc to Template
const docToTemplate = (docSnap: { id: string; data: () => Record<string, unknown> }): SignNowContractTemplate => {
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: toISOString(data.createdAt),
    updatedAt: toISOString(data.updatedAt),
    lastUsedAt: data.lastUsedAt ? toISOString(data.lastUsedAt) : undefined,
  } as SignNowContractTemplate;
};

// Helper to convert Firestore doc to Signer
const docToSigner = (docSnap: { id: string; data: () => Record<string, unknown> }): ContractSigner => {
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    viewedAt: data.viewedAt ? toISOString(data.viewedAt) : undefined,
    signedAt: data.signedAt ? toISOString(data.signedAt) : undefined,
    declinedAt: data.declinedAt ? toISOString(data.declinedAt) : undefined,
  } as ContractSigner;
};

// Helper to convert Firestore doc to AuditEvent
const docToAuditEvent = (docSnap: { id: string; data: () => Record<string, unknown> }): ContractAuditEvent => {
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    timestamp: toISOString(data.timestamp),
  } as ContractAuditEvent;
};

export const useContractStore = create<ContractStore>((set, get) => ({
  // Initial State
  contracts: [],
  templates: [],
  currentContract: null,
  currentContractSigners: [],
  currentContractAuditEvents: [],
  loading: false,
  error: null,

  // ============================================================================
  // Contract Actions
  // ============================================================================

  createContract: async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to create contracts');

    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const contractData = {
        ...data,
        userId: user.uid,
        status: data.status || 'draft',
        signers: data.signers || [],
        signingOrder: data.signingOrder || 'parallel',
        remindersSent: 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, 'contracts'), contractData);
      set({ loading: false });
      return docRef.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create contract';
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateContract: async (contractId, data) => {
    set({ loading: true, error: null });
    try {
      const contractRef = doc(db, 'contracts', contractId);
      await updateDoc(contractRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update contract';
      set({ error: message, loading: false });
      throw error;
    }
  },

  deleteContract: async (contractId) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'contracts', contractId));
      set({ loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete contract';
      set({ error: message, loading: false });
      throw error;
    }
  },

  cancelContract: async (contractId) => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const contractRef = doc(db, 'contracts', contractId);
      await updateDoc(contractRef, {
        status: 'cancelled',
        cancelledAt: now,
        updatedAt: now,
      });

      // Add audit event
      await addDoc(collection(db, 'contracts', contractId, 'auditEvents'), {
        contractId,
        eventType: 'cancelled',
        timestamp: now,
        actorType: 'breeder',
        actorId: auth.currentUser?.uid,
        description: 'Contract cancelled by breeder',
      });

      set({ loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel contract';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // Signer Actions
  // ============================================================================

  addSigner: async (contractId, signer) => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const signerData = {
        ...signer,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(
        collection(db, 'contracts', contractId, 'signers'),
        signerData
      );

      // Update contract's signers array
      const contractRef = doc(db, 'contracts', contractId);
      const contractDoc = await getDoc(contractRef);
      if (contractDoc.exists()) {
        const contract = contractDoc.data() as SignNowContract;
        await updateDoc(contractRef, {
          signers: [...(contract.signers || []), { ...signerData, id: docRef.id }],
          updatedAt: now,
        });
      }

      set({ loading: false });
      return docRef.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add signer';
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateSigner: async (contractId, signerId, data) => {
    set({ loading: true, error: null });
    try {
      const signerRef = doc(db, 'contracts', contractId, 'signers', signerId);
      await updateDoc(signerRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update signer';
      set({ error: message, loading: false });
      throw error;
    }
  },

  removeSigner: async (contractId, signerId) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'contracts', contractId, 'signers', signerId));
      set({ loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove signer';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // Template Actions
  // ============================================================================

  createTemplate: async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to create templates');

    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const templateData = {
        ...data,
        userId: user.uid,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(
        collection(db, 'breederProfiles', user.uid, 'contractTemplates'),
        templateData
      );
      set({ loading: false });
      return docRef.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create template';
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateTemplate: async (templateId, data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    set({ loading: true, error: null });
    try {
      const templateRef = doc(db, 'breederProfiles', user.uid, 'contractTemplates', templateId);
      await updateDoc(templateRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update template';
      set({ error: message, loading: false });
      throw error;
    }
  },

  deleteTemplate: async (templateId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'breederProfiles', user.uid, 'contractTemplates', templateId));
      set({ loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete template';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // Subscriptions
  // ============================================================================

  subscribeToContracts: (userId) => {
    set({ loading: true });
    const q = query(
      collection(db, 'contracts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const contracts = snapshot.docs.map(docToContract);
        set({ contracts, loading: false });
      },
      (error) => {
        console.error('Error subscribing to contracts:', error);
        set({ error: error.message, loading: false });
      }
    );

    return unsubscribe;
  },

  subscribeToContract: (contractId) => {
    set({ loading: true });
    const contractRef = doc(db, 'contracts', contractId);

    const unsubscribe = onSnapshot(
      contractRef,
      (snapshot) => {
        if (snapshot.exists()) {
          set({ currentContract: docToContract(snapshot), loading: false });
        } else {
          set({ currentContract: null, loading: false });
        }
      },
      (error) => {
        console.error('Error subscribing to contract:', error);
        set({ error: error.message, loading: false });
      }
    );

    return unsubscribe;
  },

  subscribeToContractSigners: (contractId) => {
    const q = query(
      collection(db, 'contracts', contractId, 'signers'),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const signers = snapshot.docs.map(docToSigner);
        set({ currentContractSigners: signers });
      },
      (error) => {
        console.error('Error subscribing to signers:', error);
      }
    );

    return unsubscribe;
  },

  subscribeToContractAuditEvents: (contractId) => {
    const q = query(
      collection(db, 'contracts', contractId, 'auditEvents'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const events = snapshot.docs.map(docToAuditEvent);
        set({ currentContractAuditEvents: events });
      },
      (error) => {
        console.error('Error subscribing to audit events:', error);
      }
    );

    return unsubscribe;
  },

  subscribeToTemplates: (userId) => {
    set({ loading: true });
    const q = query(
      collection(db, 'breederProfiles', userId, 'contractTemplates'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const templates = snapshot.docs.map(docToTemplate);
        set({ templates, loading: false });
      },
      (error) => {
        console.error('Error subscribing to templates:', error);
        set({ error: error.message, loading: false });
      }
    );

    return unsubscribe;
  },

  // ============================================================================
  // Queries
  // ============================================================================

  getContractById: async (contractId) => {
    try {
      const contractDoc = await getDoc(doc(db, 'contracts', contractId));
      if (contractDoc.exists()) {
        return docToContract(contractDoc);
      }
      return null;
    } catch (error) {
      console.error('Error getting contract:', error);
      return null;
    }
  },

  getContractsByStatus: async (userId, status) => {
    try {
      const q = query(
        collection(db, 'contracts'),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToContract);
    } catch (error) {
      console.error('Error getting contracts by status:', error);
      return [];
    }
  },

  getContractsByPuppy: async (puppyId) => {
    try {
      const q = query(
        collection(db, 'contracts'),
        where('puppyId', '==', puppyId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToContract);
    } catch (error) {
      console.error('Error getting contracts by puppy:', error);
      return [];
    }
  },

  getTemplateById: async (templateId) => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const templateDoc = await getDoc(
        doc(db, 'breederProfiles', user.uid, 'contractTemplates', templateId)
      );
      if (templateDoc.exists()) {
        return docToTemplate(templateDoc);
      }
      return null;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  },

  // ============================================================================
  // Utility
  // ============================================================================

  setCurrentContract: (contract) => {
    set({ currentContract: contract });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      contracts: [],
      templates: [],
      currentContract: null,
      currentContractSigners: [],
      currentContractAuditEvents: [],
      loading: false,
      error: null,
    });
  },
}));
