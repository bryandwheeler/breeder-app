import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Dog, Customer, ContactRole, Litter, StudJob, WaitlistEntry } from '@breeder/types';

interface MigrationStats {
  guardiansProcessed: number;
  guardiansCreated: number;
  externalParentsProcessed: number;
  externalParentsCreated: number;
  studJobsProcessed: number;
  studJobsCreated: number;
  errors: string[];
}

interface ContactKey {
  email?: string;
  phone?: string;
  name: string;
}

/**
 * Normalize phone number to last 10 digits for matching
 */
function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : undefined;
}

/**
 * Create a unique key for contact deduplication
 */
function getContactKey(data: ContactKey): string {
  // Prefer email for uniqueness, then phone, then name
  if (data.email?.trim()) {
    return `email:${data.email.trim().toLowerCase()}`;
  }
  const normalizedPhone = normalizePhone(data.phone);
  if (normalizedPhone) {
    return `phone:${normalizedPhone}`;
  }
  return `name:${data.name.trim().toLowerCase()}`;
}

/**
 * Find existing contact by email or phone
 */
function findExistingContact(
  contacts: Customer[],
  email?: string,
  phone?: string
): Customer | undefined {
  if (email?.trim()) {
    const normalized = email.trim().toLowerCase();
    const match = contacts.find((c) => c.email?.toLowerCase() === normalized);
    if (match) return match;
  }

  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone) {
      const match = contacts.find((c) => {
        const contactPhone = normalizePhone(c.phone);
        return contactPhone === normalizedPhone;
      });
      if (match) return match;
    }
  }

  return undefined;
}

/**
 * Migrate guardian homes to Contact system
 */
async function migrateGuardianHomes(
  userId: string,
  contactMap: Map<string, Customer>,
  stats: MigrationStats
): Promise<void> {
  console.log('Migrating guardian homes...');

  // Query all dogs with guardian status
  const dogsRef = collection(db, 'dogs');
  const guardianDogsQuery = query(
    dogsRef,
    where('userId', '==', userId),
    where('programStatus', '==', 'guardian')
  );

  const dogsSnapshot = await getDocs(guardianDogsQuery);
  const batch = writeBatch(db);
  let batchCount = 0;

  for (const dogDoc of dogsSnapshot.docs) {
    const dog = dogDoc.data() as Dog;

    if (!dog.guardianHome) continue;
    if (dog.guardianHome.contactId) {
      // Already migrated
      continue;
    }

    stats.guardiansProcessed++;

    const guardianData = {
      name: dog.guardianHome.guardianName || 'Unknown Guardian',
      email: dog.guardianHome.email,
      phone: dog.guardianHome.phone,
    };

    // Check if contact already exists
    const existingContact = findExistingContact(
      Array.from(contactMap.values()),
      guardianData.email,
      guardianData.phone
    );

    let contactId: string;

    if (existingContact) {
      // Use existing contact, add guardian role if needed
      contactId = existingContact.id;

      if (!existingContact.contactRoles?.includes('guardian')) {
        const updatedRoles = [...(existingContact.contactRoles || []), 'guardian' as ContactRole];
        batch.update(doc(db, 'customers', contactId), {
          contactRoles: updatedRoles as ContactRole[],
        });
        existingContact.contactRoles = updatedRoles as ContactRole[];
      }
    } else {
      // Create new contact
      const contactKey = getContactKey(guardianData);
      let contact = contactMap.get(contactKey);

      if (!contact) {
        contactId = doc(collection(db, 'customers')).id;
        contact = {
          id: contactId,
          userId,
          breederId: userId, // Required by Firestore rules
          name: guardianData.name,
          email: guardianData.email || '',
          phone: guardianData.phone,
          address: dog.guardianHome.address,
          type: 'buyer',
          status: 'active',
          contactRoles: ['guardian', 'customer'] as ContactRole[],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Customer;

        batch.set(doc(db, 'customers', contactId), contact);
        contactMap.set(contactKey, contact);
        stats.guardiansCreated++;
      } else {
        contactId = contact.id;
      }
    }

    // Update dog with contactId
    batch.update(doc(db, 'dogs', dogDoc.id), {
      'guardianHome.contactId': contactId,
    });

    batchCount++;
    if (batchCount >= 500) {
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Migrated ${stats.guardiansProcessed} guardian homes, created ${stats.guardiansCreated} new contacts`);
}

/**
 * Migrate external parents to Contact system
 */
async function migrateExternalParents(
  userId: string,
  contactMap: Map<string, Customer>,
  stats: MigrationStats
): Promise<void> {
  console.log('Migrating external parents...');

  // Query all dogs with external sire or dam
  const dogsRef = collection(db, 'dogs');
  const dogsQuery = query(dogsRef, where('userId', '==', userId));
  const dogsSnapshot = await getDocs(dogsQuery);

  // Also query litters for external sires
  const littersRef = collection(db, 'litters');
  const littersQuery = query(littersRef, where('userId', '==', userId));
  const littersSnapshot = await getDocs(littersQuery);

  const batch = writeBatch(db);
  let batchCount = 0;

  // Process dogs with external sire
  for (const dogDoc of dogsSnapshot.docs) {
    const dog = dogDoc.data() as Dog;

    // Process external sire
    if (dog.externalSire && !dog.externalSire.contactId) {
      const breederData = {
        name: dog.externalSire.breederName || dog.externalSire.kennelName || 'Unknown Breeder',
        email: undefined,
        phone: undefined,
      };

      const contactKey = getContactKey(breederData);
      let contact = contactMap.get(contactKey);
      let contactId: string;

      if (!contact) {
        contactId = doc(collection(db, 'customers')).id;
        contact = {
          id: contactId,
          userId,
          breederId: userId, // Required by Firestore rules
          name: breederData.name,
          email: '',
          type: 'prospect',
          status: 'active',
          contactRoles: ['breeder'] as ContactRole[],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Customer;

        batch.set(doc(db, 'customers', contactId), contact);
        contactMap.set(contactKey, contact);
        stats.externalParentsCreated++;
      } else {
        contactId = contact.id;

        // Add breeder role if not present
        if (!contact.contactRoles?.includes('breeder')) {
          const updatedRoles = [...(contact.contactRoles || []), 'breeder' as ContactRole];
          batch.update(doc(db, 'customers', contactId), {
            contactRoles: updatedRoles as ContactRole[],
          });
          contact.contactRoles = updatedRoles as ContactRole[];
        }
      }

      batch.update(doc(db, 'dogs', dogDoc.id), {
        'externalSire.contactId': contactId,
      });

      stats.externalParentsProcessed++;
      batchCount++;
    }

    // Process external dam
    if (dog.externalDam && !dog.externalDam.contactId) {
      const breederData = {
        name: dog.externalDam.breederName || dog.externalDam.kennelName || 'Unknown Breeder',
        email: undefined,
        phone: undefined,
      };

      const contactKey = getContactKey(breederData);
      let contact = contactMap.get(contactKey);
      let contactId: string;

      if (!contact) {
        contactId = doc(collection(db, 'customers')).id;
        contact = {
          id: contactId,
          userId,
          breederId: userId, // Required by Firestore rules
          name: breederData.name,
          email: '',
          type: 'prospect',
          status: 'active',
          contactRoles: ['breeder'] as ContactRole[],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Customer;

        batch.set(doc(db, 'customers', contactId), contact);
        contactMap.set(contactKey, contact);
        stats.externalParentsCreated++;
      } else {
        contactId = contact.id;

        // Add breeder role if not present
        if (!contact.contactRoles?.includes('breeder')) {
          const updatedRoles = [...(contact.contactRoles || []), 'breeder' as ContactRole];
          batch.update(doc(db, 'customers', contactId), {
            contactRoles: updatedRoles as ContactRole[],
          });
          contact.contactRoles = updatedRoles as ContactRole[];
        }
      }

      batch.update(doc(db, 'dogs', dogDoc.id), {
        'externalDam.contactId': contactId,
      });

      stats.externalParentsProcessed++;
      batchCount++;
    }

    if (batchCount >= 500) {
      await batch.commit();
      batchCount = 0;
    }
  }

  // Process litters with external sire
  for (const litterDoc of littersSnapshot.docs) {
    const litter = litterDoc.data() as Litter;

    if (litter.externalSire && !litter.externalSire.contactId) {
      const breederData = {
        name: litter.externalSire.breederName || litter.externalSire.kennelName || 'Unknown Breeder',
        email: undefined,
        phone: undefined,
      };

      const contactKey = getContactKey(breederData);
      let contact = contactMap.get(contactKey);
      let contactId: string;

      if (!contact) {
        contactId = doc(collection(db, 'customers')).id;
        contact = {
          id: contactId,
          userId,
          breederId: userId, // Required by Firestore rules
          name: breederData.name,
          email: '',
          type: 'prospect',
          status: 'active',
          contactRoles: ['breeder'] as ContactRole[],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Customer;

        batch.set(doc(db, 'customers', contactId), contact);
        contactMap.set(contactKey, contact);
        stats.externalParentsCreated++;
      } else {
        contactId = contact.id;

        // Add breeder role if not present
        if (!contact.contactRoles?.includes('breeder')) {
          const updatedRoles = [...(contact.contactRoles || []), 'breeder' as ContactRole];
          batch.update(doc(db, 'customers', contactId), {
            contactRoles: updatedRoles as ContactRole[],
          });
          contact.contactRoles = updatedRoles as ContactRole[];
        }
      }

      batch.update(doc(db, 'litters', litterDoc.id), {
        'externalSire.contactId': contactId,
      });

      stats.externalParentsProcessed++;
      batchCount++;
    }

    if (batchCount >= 500) {
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Migrated ${stats.externalParentsProcessed} external parents, created ${stats.externalParentsCreated} new contacts`);
}

/**
 * Migrate stud jobs to Contact system
 */
async function migrateStudJobs(
  userId: string,
  contactMap: Map<string, Customer>,
  stats: MigrationStats
): Promise<void> {
  console.log('Migrating stud jobs...');

  // Query all stud jobs for this user
  const studJobsRef = collection(db, 'studJobs');
  const studJobsQuery = query(studJobsRef, where('userId', '==', userId));
  console.log('Querying stud jobs for user:', userId);
  const studJobsSnapshot = await getDocs(studJobsQuery);
  console.log('Found', studJobsSnapshot.docs.length, 'stud jobs');

  const batch = writeBatch(db);
  let batchCount = 0;

  for (const jobDoc of studJobsSnapshot.docs) {
    const job = jobDoc.data() as StudJob;

    if (job.contactId) {
      // Already migrated
      continue;
    }

    stats.studJobsProcessed++;

    const breederData = {
      name: job.breederName || 'Unknown Breeder',
      email: job.breederEmail,
      phone: job.breederPhone,
    };

    // Check if contact already exists
    const existingContact = findExistingContact(
      Array.from(contactMap.values()),
      breederData.email,
      breederData.phone
    );

    let contactId: string;

    if (existingContact) {
      // Use existing contact, add stud_job_customer role if needed
      contactId = existingContact.id;

      if (!existingContact.contactRoles?.includes('stud_job_customer')) {
        const updatedRoles = [...(existingContact.contactRoles || []), 'stud_job_customer' as ContactRole];
        batch.update(doc(db, 'customers', contactId), {
          contactRoles: updatedRoles as ContactRole[],
        });
        existingContact.contactRoles = updatedRoles as ContactRole[];
      }
    } else {
      // Create new contact
      const contactKey = getContactKey(breederData);
      let contact = contactMap.get(contactKey);

      if (!contact) {
        contactId = doc(collection(db, 'customers')).id;
        contact = {
          id: contactId,
          userId,
          breederId: userId, // Required by Firestore rules
          name: breederData.name,
          email: breederData.email || '',
          phone: breederData.phone || undefined,
          type: 'stud_client',
          status: 'active',
          contactRoles: ['stud_job_customer', 'breeder'] as ContactRole[],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Customer;

        // Remove undefined fields before saving
        if (!contact.phone) delete contact.phone;

        batch.set(doc(db, 'customers', contactId), contact);
        contactMap.set(contactKey, contact);
        stats.studJobsCreated++;
      } else {
        contactId = contact.id;
      }
    }

    // Update stud job with contactId
    batch.update(doc(db, 'studJobs', jobDoc.id), {
      contactId: contactId,
    });

    batchCount++;
    if (batchCount >= 500) {
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Migrated ${stats.studJobsProcessed} stud jobs, created ${stats.studJobsCreated} new contacts`);
}

interface WaitlistMigrationStats {
  waitlistProcessed: number;
  waitlistLinked: number;
  contactsCreated: number;
  errors: string[];
}

/**
 * Migrate waitlist entries to Contact system
 * Creates contacts for waitlist applicants and links them
 */
export async function migrateWaitlistToContacts(userId: string): Promise<WaitlistMigrationStats> {
  console.log(`Starting waitlist contact migration for user ${userId}...`);

  const stats: WaitlistMigrationStats = {
    waitlistProcessed: 0,
    waitlistLinked: 0,
    contactsCreated: 0,
    errors: [],
  };

  try {
    // Load existing contacts
    const customersRef = collection(db, 'customers');
    const customersQuery = query(customersRef, where('breederId', '==', userId));
    const customersSnapshot = await getDocs(customersQuery);

    const contactMap = new Map<string, Customer>();
    customersSnapshot.docs.forEach((docSnapshot) => {
      const customer = { id: docSnapshot.id, ...docSnapshot.data() } as Customer;
      const key = getContactKey({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      });
      contactMap.set(key, customer);
    });

    console.log(`Found ${contactMap.size} existing contacts`);

    // Query all waitlist entries for this breeder
    const waitlistRef = collection(db, 'waitlist');
    const waitlistQuery = query(waitlistRef, where('breederId', '==', userId));
    const waitlistSnapshot = await getDocs(waitlistQuery);

    console.log(`Found ${waitlistSnapshot.docs.length} waitlist entries`);

    const batch = writeBatch(db);
    let batchCount = 0;

    for (const waitlistDoc of waitlistSnapshot.docs) {
      const entry = waitlistDoc.data() as WaitlistEntry;
      stats.waitlistProcessed++;

      // Skip if already linked
      if (entry.contactId) {
        stats.waitlistLinked++;
        continue;
      }

      const applicantData = {
        name: entry.name || 'Unknown',
        email: entry.email,
        phone: entry.phone,
      };

      // Check if contact already exists by email or phone
      const existingContact = findExistingContact(
        Array.from(contactMap.values()),
        applicantData.email,
        applicantData.phone
      );

      let contactId: string;

      if (existingContact) {
        // Use existing contact, add prospect role if needed
        contactId = existingContact.id;

        if (!existingContact.contactRoles?.includes('prospect')) {
          const updatedRoles = [...(existingContact.contactRoles || []), 'prospect' as ContactRole];
          batch.update(doc(db, 'customers', contactId), {
            contactRoles: updatedRoles as ContactRole[],
          });
          existingContact.contactRoles = updatedRoles as ContactRole[];
        }

        stats.waitlistLinked++;
      } else {
        // Create new contact
        const contactKey = getContactKey(applicantData);
        let contact = contactMap.get(contactKey);

        if (!contact) {
          contactId = doc(collection(db, 'customers')).id;
          contact = {
            id: contactId,
            userId,
            breederId: userId,
            name: applicantData.name,
            email: (applicantData.email || '').toLowerCase().trim(),
            phone: applicantData.phone || '',
            address: entry.address || '',
            city: entry.city || '',
            state: entry.state || '',
            type: 'prospect',
            status: 'active',
            source: 'website',
            preferredContact: 'email',
            emailOptIn: true,
            smsOptIn: false,
            firstContactDate: entry.applicationDate || new Date().toISOString().split('T')[0],
            lastContactDate: entry.applicationDate || new Date().toISOString().split('T')[0],
            totalPurchases: 0,
            totalRevenue: 0,
            lifetimeValue: 0,
            interactions: [],
            purchases: [],
            tags: [],
            contactRoles: ['prospect'] as ContactRole[],
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Customer;

          batch.set(doc(db, 'customers', contactId), contact);
          contactMap.set(contactKey, contact);
          stats.contactsCreated++;
          stats.waitlistLinked++;
        } else {
          contactId = contact.id;
          stats.waitlistLinked++;
        }
      }

      // Update waitlist entry with contactId
      batch.update(doc(db, 'waitlist', waitlistDoc.id), {
        contactId: contactId,
      });

      batchCount++;
      if (batchCount >= 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`Migrated ${stats.waitlistProcessed} waitlist entries, linked ${stats.waitlistLinked}, created ${stats.contactsCreated} new contacts`);

    return stats;
  } catch (error) {
    console.error('Waitlist migration failed:', error);
    stats.errors.push(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Main migration function
 */
export async function migrateToContacts(userId: string): Promise<MigrationStats> {
  console.log(`Starting contact migration for user ${userId}...`);

  const stats: MigrationStats = {
    guardiansProcessed: 0,
    guardiansCreated: 0,
    externalParentsProcessed: 0,
    externalParentsCreated: 0,
    studJobsProcessed: 0,
    studJobsCreated: 0,
    errors: [],
  };

  try {
    // Load existing contacts
    console.log('Loading existing contacts for user:', userId);
    const customersRef = collection(db, 'customers');
    // Query by breederId to match Firestore security rules
    const customersQuery = query(customersRef, where('breederId', '==', userId));
    const customersSnapshot = await getDocs(customersQuery);
    console.log('Loaded customers snapshot');

    const contactMap = new Map<string, Customer>();
    customersSnapshot.docs.forEach((doc) => {
      const customer = doc.data() as Customer;
      const key = getContactKey({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      });
      contactMap.set(key, customer);
    });

    console.log(`Found ${contactMap.size} existing contacts`);

    // Run migrations
    try {
      await migrateGuardianHomes(userId, contactMap, stats);
    } catch (error) {
      console.error('Error in migrateGuardianHomes:', error);
      throw error;
    }

    try {
      await migrateExternalParents(userId, contactMap, stats);
    } catch (error) {
      console.error('Error in migrateExternalParents:', error);
      throw error;
    }

    try {
      await migrateStudJobs(userId, contactMap, stats);
    } catch (error) {
      console.error('Error in migrateStudJobs:', error);
      throw error;
    }

    console.log('Migration completed successfully!');
    console.log('Stats:', stats);

    return stats;
  } catch (error) {
    console.error('Migration failed:', error);
    stats.errors.push(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}
