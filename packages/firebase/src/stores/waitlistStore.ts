// Firestore-powered waitlist store
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
  setDoc,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import {
  WaitlistEntry,
  CoApplicant,
  WaitlistFormConfig,
  createDefaultFormConfig,
} from '@breeder/types';

type Store = {
  waitlist: WaitlistEntry[];
  loading: boolean;
  formConfig: WaitlistFormConfig | null;
  formConfigLoading: boolean;

  // Waitlist methods
  addToWaitlist: (
    entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  addContactToWaitlist: (
    contactId: string,
    litterId?: string,
    preferences?: {
      preferredSex?: 'male' | 'female' | 'either';
      preferredColors?: string[];
      notes?: string;
    }
  ) => Promise<string>; // Returns waitlist entry ID
  assignPuppyToWaitlistEntry: (
    waitlistEntryId: string,
    puppyId: string | null, // null to unassign
    puppyName?: string
  ) => Promise<void>;
  updateWaitlistEntry: (
    id: string,
    updates: Partial<WaitlistEntry>
  ) => Promise<void>;
  deleteWaitlistEntry: (id: string) => Promise<void>;
  reorderWaitlist: (entries: WaitlistEntry[]) => Promise<void>;
  moveToPosition: (id: string, newPosition: number) => Promise<void>;
  getWaitlistForLitter: (litterId: string) => WaitlistEntry[];
  findExistingWaitlistEntry: (contactId: string, litterId?: string) => WaitlistEntry | undefined;

  // Public methods (for waitlist application form)
  submitWaitlistApplication: (
    entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt'> & { userId: string }
  ) => Promise<void>;

  // Subscription
  subscribeToWaitlist: () => () => void;

  // Form config methods
  loadFormConfig: (breederId: string) => Promise<WaitlistFormConfig>;
  saveFormConfig: (config: WaitlistFormConfig) => Promise<void>;
  loadFormConfigForPublic: (breederId: string) => Promise<WaitlistFormConfig | null>;
};

export const useWaitlistStore = create<Store>()((set, get) => ({
  waitlist: [],
  loading: false,
  formConfig: null,
  formConfigLoading: false,

  addToWaitlist: async (entry) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add to waitlist');

    const waitlistRef = collection(db, 'waitlist');

    // Get current waitlist count to set position
    const currentWaitlist = get().waitlist.filter(
      (e) => e.status === 'active' || e.status === 'approved'
    );
    const position = currentWaitlist.length + 1;

    const newEntry = {
      ...entry,
      // Backward-compat: record both, rules use breederId
      userId: user.uid,
      breederId: user.uid,
      position,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(waitlistRef, newEntry);
  },

  addContactToWaitlist: async (contactId, litterId, preferences) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add to waitlist');

    // Check for admin impersonation
    const impersonatedUserId = localStorage.getItem('impersonatedUserId');
    const targetUserId = impersonatedUserId || user.uid;

    // First, get the contact details
    const customerDoc = await getDocs(
      query(
        collection(db, 'customers'),
        where('breederId', '==', targetUserId)
      )
    );

    const contact = customerDoc.docs.find((d) => d.id === contactId);
    if (!contact) throw new Error('Contact not found');

    const contactData = contact.data();

    // Check if contact already has a waitlist entry for this litter (or general if no litterId)
    const existingEntry = get().findExistingWaitlistEntry(contactId, litterId);
    if (existingEntry) {
      // Return existing entry ID - caller can decide to update it
      return existingEntry.id;
    }

    const waitlistRef = collection(db, 'waitlist');

    // Get current waitlist count to set position
    const currentWaitlist = get().waitlist.filter(
      (e) => e.status === 'active' || e.status === 'approved'
    );
    const position = currentWaitlist.length + 1;

    // Build entry object - don't include undefined values (Firebase rejects them)
    const newEntry: Record<string, unknown> = {
      // Contact info from customer record
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone || '',
      address: contactData.address || '',
      city: contactData.city || '',
      state: contactData.state || '',
      zipCode: contactData.zipCode || '',

      // Link to contact
      contactId: contactId,

      // Preferences
      preferredSex: preferences?.preferredSex || 'either',
      preferredColors: preferences?.preferredColors || [],
      notes: preferences?.notes || '',

      // Breeder info
      userId: targetUserId,
      breederId: targetUserId,

      // Status and position
      status: 'active' as const,
      position,
      applicationDate: new Date().toISOString().split('T')[0],

      // Source tracking
      source: 'manual' as const, // Added by breeder, not via application form

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add assignedLitterId if it has a value (Firebase doesn't accept undefined)
    if (litterId) {
      newEntry.assignedLitterId = litterId;
    }

    const docRef = await addDoc(waitlistRef, newEntry);

    // Update the contact to add 'prospect' role if not present
    const currentRoles = contactData.contactRoles || [];
    if (!currentRoles.includes('prospect')) {
      await updateDoc(doc(db, 'customers', contactId), {
        contactRoles: [...currentRoles, 'prospect'],
        updatedAt: serverTimestamp(),
      });
    }

    return docRef.id;
  },

  getWaitlistForLitter: (litterId) => {
    return get().waitlist.filter(
      (entry) => entry.assignedLitterId === litterId
    );
  },

  findExistingWaitlistEntry: (contactId, litterId) => {
    const waitlist = get().waitlist;
    return waitlist.find((entry) => {
      if (entry.contactId !== contactId) return false;
      // If litterId provided, match on that too
      if (litterId) {
        return entry.assignedLitterId === litterId;
      }
      // Otherwise just match on contactId (general waitlist)
      return !entry.assignedLitterId;
    });
  },

  updateWaitlistEntry: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update waitlist');

    const entryRef = doc(db, 'waitlist', id);
    await updateDoc(entryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteWaitlistEntry: async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete waitlist entry');

    const entryRef = doc(db, 'waitlist', id);
    await deleteDoc(entryRef);

    // Reorder remaining entries
    const remainingEntries = get()
      .waitlist.filter(
        (e) => e.id !== id && (e.status === 'active' || e.status === 'approved')
      )
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    for (let i = 0; i < remainingEntries.length; i++) {
      await updateDoc(doc(db, 'waitlist', remainingEntries[i].id), {
        position: i + 1,
        updatedAt: serverTimestamp(),
      });
    }
  },

  reorderWaitlist: async (entries) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to reorder waitlist');

    // Update positions for all entries
    for (let i = 0; i < entries.length; i++) {
      const entryRef = doc(db, 'waitlist', entries[i].id);
      await updateDoc(entryRef, {
        position: i + 1,
        updatedAt: serverTimestamp(),
      });
    }
  },

  moveToPosition: async (id, newPosition) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to reorder waitlist');

    const waitlist = get()
      .waitlist.filter((e) => e.status === 'active' || e.status === 'approved')
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const entryIndex = waitlist.findIndex((e) => e.id === id);
    if (entryIndex === -1) return;

    // Reorder array
    const entry = waitlist[entryIndex];
    waitlist.splice(entryIndex, 1);
    waitlist.splice(newPosition - 1, 0, entry);

    // Update all positions
    await get().reorderWaitlist(waitlist);
  },

  submitWaitlistApplication: async (entry) => {
    // Public method - doesn't require auth
    // The userId will be set by the breeder who owns the application form
    const breederId = (entry as any).userId;
    const waitlistRef = collection(db, 'waitlist');
    const customersRef = collection(db, 'customers');

    // Get current count to set position
    // Count existing entries for this breeder using breederId
    const snapshot = await getDocs(
      query(waitlistRef, where('breederId', '==', breederId))
    );
    const position = snapshot.docs.length + 1;

    // Find or create a contact for this applicant
    let contactId: string | undefined;

    try {
      // Search for existing contact by email first
      const emailQuery = query(
        customersRef,
        where('breederId', '==', breederId),
        where('email', '==', entry.email.toLowerCase().trim())
      );
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        // Found existing contact by email
        const existingContact = emailSnapshot.docs[0];
        contactId = existingContact.id;

        // Update contact roles to include 'prospect' if not already
        const currentRoles = existingContact.data().contactRoles || [];
        if (!currentRoles.includes('prospect')) {
          await updateDoc(doc(db, 'customers', contactId), {
            contactRoles: [...currentRoles, 'prospect'],
            updatedAt: serverTimestamp(),
          });
        }
      } else if (entry.phone) {
        // Try phone match - normalize to last 10 digits
        const normalizedPhone = entry.phone.replace(/\D/g, '').slice(-10);
        if (normalizedPhone.length === 10) {
          // Query all customers for this breeder and filter in memory
          // (Firestore doesn't support partial string matching)
          const allCustomersQuery = query(
            customersRef,
            where('breederId', '==', breederId)
          );
          const allCustomersSnapshot = await getDocs(allCustomersQuery);

          for (const customerDoc of allCustomersSnapshot.docs) {
            const customerPhone = (customerDoc.data().phone || '').replace(/\D/g, '');
            if (customerPhone.slice(-10) === normalizedPhone) {
              contactId = customerDoc.id;

              // Update contact roles to include 'prospect' if not already
              const currentRoles = customerDoc.data().contactRoles || [];
              if (!currentRoles.includes('prospect')) {
                await updateDoc(doc(db, 'customers', contactId), {
                  contactRoles: [...currentRoles, 'prospect'],
                  updatedAt: serverTimestamp(),
                });
              }
              break;
            }
          }
        }
      }

      // If no existing contact found, create a new one
      if (!contactId) {
        // Include social media info if provided
        const socialMediaFields: Record<string, string> = {};
        if ((entry as any).socialMedia?.instagramHandle) {
          socialMediaFields.instagram = (entry as any).socialMedia.instagramHandle;
        }
        if ((entry as any).socialMedia?.facebookProfile) {
          socialMediaFields.facebook = (entry as any).socialMedia.facebookProfile;
        }

        const newCustomer = {
          name: entry.name,
          email: entry.email.toLowerCase().trim(),
          phone: entry.phone || '',
          address: entry.address || '',
          city: entry.city || '',
          state: entry.state || '',
          type: 'prospect',
          status: 'active',
          source: 'website',
          preferredContact: 'email',
          emailOptIn: true,
          smsOptIn: false,
          userId: breederId,
          breederId: breederId,
          firstContactDate: new Date().toISOString().split('T')[0],
          lastContactDate: new Date().toISOString().split('T')[0],
          totalPurchases: 0,
          totalRevenue: 0,
          lifetimeValue: 0,
          interactions: [],
          purchases: [],
          tags: [],
          contactRoles: ['prospect'],
          notes: '',
          ...socialMediaFields,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const newContactDoc = await addDoc(customersRef, newCustomer);
        contactId = newContactDoc.id;
      } else {
        // Update existing contact with social media info if provided and not already set
        const socialMediaUpdates: Record<string, string> = {};
        if ((entry as any).socialMedia?.instagramHandle) {
          socialMediaUpdates.instagram = (entry as any).socialMedia.instagramHandle;
        }
        if ((entry as any).socialMedia?.facebookProfile) {
          socialMediaUpdates.facebook = (entry as any).socialMedia.facebookProfile;
        }
        if (Object.keys(socialMediaUpdates).length > 0) {
          await updateDoc(doc(db, 'customers', contactId), {
            ...socialMediaUpdates,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      // Log error but don't fail the waitlist submission
      console.error('Error creating/linking contact for waitlist application:', error);
    }

    // Process co-applicants - create/match contacts for each
    const additionalContactIds: string[] = [];
    const coApplicants: CoApplicant[] = (entry as any).coApplicants || [];

    for (const coApplicant of coApplicants) {
      if (!coApplicant.name || !coApplicant.email || !coApplicant.phone) continue;

      try {
        let coContactId: string | undefined;

        // Search for existing contact by email
        const coEmailQuery = query(
          customersRef,
          where('breederId', '==', breederId),
          where('email', '==', coApplicant.email.toLowerCase().trim())
        );
        const coEmailSnapshot = await getDocs(coEmailQuery);

        if (!coEmailSnapshot.empty) {
          // Found existing contact by email
          coContactId = coEmailSnapshot.docs[0].id;
          const currentRoles = coEmailSnapshot.docs[0].data().contactRoles || [];
          if (!currentRoles.includes('prospect')) {
            await updateDoc(doc(db, 'customers', coContactId), {
              contactRoles: [...currentRoles, 'prospect'],
              updatedAt: serverTimestamp(),
            });
          }
        } else {
          // Try phone match
          const normalizedPhone = coApplicant.phone.replace(/\D/g, '').slice(-10);
          if (normalizedPhone.length === 10) {
            const allCustomersQuery = query(
              customersRef,
              where('breederId', '==', breederId)
            );
            const allCustomersSnapshot = await getDocs(allCustomersQuery);

            for (const customerDoc of allCustomersSnapshot.docs) {
              const customerPhone = (customerDoc.data().phone || '').replace(/\D/g, '');
              if (customerPhone.slice(-10) === normalizedPhone) {
                coContactId = customerDoc.id;
                const currentRoles = customerDoc.data().contactRoles || [];
                if (!currentRoles.includes('prospect')) {
                  await updateDoc(doc(db, 'customers', coContactId), {
                    contactRoles: [...currentRoles, 'prospect'],
                    updatedAt: serverTimestamp(),
                  });
                }
                break;
              }
            }
          }
        }

        // If no existing contact found, create a new one
        if (!coContactId) {
          const newCoCustomer = {
            name: coApplicant.name,
            email: coApplicant.email.toLowerCase().trim(),
            phone: coApplicant.phone,
            type: 'prospect',
            status: 'active',
            source: 'website',
            preferredContact: 'email',
            emailOptIn: true,
            smsOptIn: false,
            userId: breederId,
            breederId: breederId,
            firstContactDate: new Date().toISOString().split('T')[0],
            lastContactDate: new Date().toISOString().split('T')[0],
            totalPurchases: 0,
            totalRevenue: 0,
            lifetimeValue: 0,
            interactions: [],
            purchases: [],
            tags: coApplicant.relationship ? [`Co-applicant: ${coApplicant.relationship}`] : ['Co-applicant'],
            contactRoles: ['prospect'],
            notes: `Added as co-applicant for ${entry.name}'s application${coApplicant.relationship ? ` (${coApplicant.relationship})` : ''}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const newCoContactDoc = await addDoc(customersRef, newCoCustomer);
          coContactId = newCoContactDoc.id;
        }

        // Update the co-applicant record with the contact ID
        coApplicant.contactId = coContactId;
        additionalContactIds.push(coContactId);
      } catch (error) {
        console.error('Error creating/linking co-applicant contact:', error);
      }
    }

    // Check if this contact already has a waitlist entry (merge if so)
    if (contactId) {
      const existingEntriesQuery = query(
        waitlistRef,
        where('breederId', '==', breederId),
        where('contactId', '==', contactId)
      );
      const existingEntriesSnapshot = await getDocs(existingEntriesQuery);

      if (!existingEntriesSnapshot.empty) {
        // Found existing entry - merge the form data into it
        const existingEntry = existingEntriesSnapshot.docs[0];
        const existingData = existingEntry.data();

        // Merge: form data takes precedence for questionnaire fields,
        // but preserve original position and assignment
        const mergedData = {
          // Update contact info from form (may have new address, etc.)
          name: entry.name || existingData.name,
          email: entry.email || existingData.email,
          phone: entry.phone || existingData.phone,
          address: entry.address || existingData.address,
          city: entry.city || existingData.city,
          state: entry.state || existingData.state,
          zipCode: entry.zipCode || existingData.zipCode,

          // Merge questionnaire data - prefer form submission
          homeOwnership: entry.homeOwnership || existingData.homeOwnership,
          hasYard: entry.hasYard ?? existingData.hasYard,
          yardFenced: entry.yardFenced ?? existingData.yardFenced,
          otherPets: entry.otherPets || existingData.otherPets,
          children: entry.children ?? existingData.children,
          childrenAges: entry.childrenAges || existingData.childrenAges,
          experience: entry.experience || existingData.experience,
          lifestyle: entry.lifestyle || existingData.lifestyle,
          reason: entry.reason || existingData.reason,
          vetReference: entry.vetReference || existingData.vetReference,
          personalReferences: entry.personalReferences || existingData.personalReferences,

          // Merge preferences - prefer form submission
          preferredSex: entry.preferredSex || existingData.preferredSex,
          preferredColors: entry.preferredColors?.length ? entry.preferredColors : existingData.preferredColors,
          preferredSize: entry.preferredSize || existingData.preferredSize,
          timeline: entry.timeline || existingData.timeline,

          // Preserve assignment and position from original entry
          // (breeder may have already assigned them to a litter)
          assignedLitterId: existingData.assignedLitterId,
          assignedPuppyId: existingData.assignedPuppyId,
          position: existingData.position,

          // Update status to pending if it was just 'active' (manually added)
          status: existingData.status === 'active' ? 'pending' : existingData.status,

          // Append notes if provided
          notes: entry.notes
            ? existingData.notes
              ? `${existingData.notes}\n\n--- Application Update ---\n${entry.notes}`
              : entry.notes
            : existingData.notes,

          // Track merge
          formSubmittedDate: new Date().toISOString().split('T')[0],
          updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, 'waitlist', existingEntry.id), mergedData);
        return; // Exit early - merged instead of creating new
      }
    }

    const newEntry = {
      ...entry,
      // Persist breederId for rules; keep userId for backward compat
      breederId: breederId,
      contactId: contactId, // Link to primary contact record
      additionalContactIds: additionalContactIds.length > 0 ? additionalContactIds : undefined,
      coApplicants: coApplicants.length > 0 ? coApplicants : undefined,
      status: 'pending' as const,
      position,
      applicationDate: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(waitlistRef, newEntry);
  },

  assignPuppyToWaitlistEntry: async (waitlistEntryId, puppyId, puppyName) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to assign puppy');

    const entryRef = doc(db, 'waitlist', waitlistEntryId);
    await updateDoc(entryRef, {
      assignedPuppyId: puppyId,
      assignedPuppyName: puppyName || null,
      updatedAt: serverTimestamp(),
    });
  },

  subscribeToWaitlist: () => {
    const user = auth.currentUser;
    if (!user) return () => {};

    set({ loading: true });

    const waitlistQuery = query(
      collection(db, 'waitlist'),
      where('breederId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      waitlistQuery,
      (snapshot) => {
        const waitlist: WaitlistEntry[] = snapshot.docs
          .map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as WaitlistEntry)
          )
          .sort((a, b) => (a.position || 0) - (b.position || 0)); // Sort in memory instead
        set({ waitlist, loading: false });
      },
      (error) => {
        console.error('Error subscribing to waitlist:', error);
        set({ loading: false });
      }
    );

    return unsubscribe;
  },

  loadFormConfig: async (breederId: string) => {
    set({ formConfigLoading: true });
    try {
      const configRef = doc(db, 'breeders', breederId, 'settings', 'waitlistFormConfig');
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        const config = configSnap.data() as WaitlistFormConfig;
        set({ formConfig: config, formConfigLoading: false });
        return config;
      } else {
        // Return default config if none exists
        const defaultConfig = createDefaultFormConfig(breederId);
        set({ formConfig: defaultConfig, formConfigLoading: false });
        return defaultConfig;
      }
    } catch (error) {
      console.error('Error loading form config:', error);
      set({ formConfigLoading: false });
      // Return default config on error
      const defaultConfig = createDefaultFormConfig(breederId);
      set({ formConfig: defaultConfig });
      return defaultConfig;
    }
  },

  saveFormConfig: async (config: WaitlistFormConfig) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to save form config');

    const configRef = doc(db, 'breeders', user.uid, 'settings', 'waitlistFormConfig');
    const updatedConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(configRef, updatedConfig);
    set({ formConfig: updatedConfig });
  },

  loadFormConfigForPublic: async (breederId: string) => {
    // Public method for loading form config (for application form)
    try {
      const configRef = doc(db, 'breeders', breederId, 'settings', 'waitlistFormConfig');
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        return configSnap.data() as WaitlistFormConfig;
      }
      // Return null if no custom config - caller can use default form
      return null;
    } catch (error) {
      console.error('Error loading public form config:', error);
      return null;
    }
  },
}));
