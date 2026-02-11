#!/usr/bin/env node
/**
 * One-time backfill script to sync existing Firestore data to Algolia.
 *
 * Prerequisites:
 *   1. Set environment variables: ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY
 *   2. Have Firebase Admin SDK credentials (uses Application Default Credentials
 *      or GOOGLE_APPLICATION_CREDENTIALS env var)
 *
 * Usage:
 *   cd functions
 *   ALGOLIA_APP_ID=xxx ALGOLIA_ADMIN_KEY=xxx node backfill-algolia.js
 */

const admin = require('firebase-admin');
const { algoliasearch } = require('algoliasearch');

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
  console.error('Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_KEY environment variables');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Algolia
const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

async function backfillBreederProfiles() {
  console.log('Backfilling breederProfiles → breeder_profiles...');
  const snapshot = await db.collection('breederProfiles').get();
  const records = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      objectID: doc.id,
      userId: data.userId || doc.id,
      kennelName: data.kennelName || '',
      breederName: data.breederName || '',
      city: data.city || '',
      state: data.state || '',
      primaryBreed: data.primaryBreed || '',
    };
  });

  if (records.length > 0) {
    await algolia.saveObjects({ indexName: 'breeder_profiles', objects: records });
    console.log(`  Indexed ${records.length} breeder profiles`);
  } else {
    console.log('  No breeder profiles found');
  }
}

async function backfillDogs() {
  console.log('Backfilling dogs → dogs...');
  const snapshot = await db.collection('dogs').get();
  const records = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      objectID: doc.id,
      name: data.name || '',
      registeredName: data.registeredName || '',
      registrationNumber: data.registrationNumber || data.registration?.number || '',
      breed: data.breed || '',
      sex: data.sex || '',
      userId: data.userId || '',
      kennelName: data.kennelName || '',
      breederName: data.breederName || '',
    };
  });

  if (records.length > 0) {
    await algolia.saveObjects({ indexName: 'dogs', objects: records });
    console.log(`  Indexed ${records.length} dogs`);
  } else {
    console.log('  No dogs found');
  }
}

async function backfillCustomers() {
  console.log('Backfilling customers → customers...');
  const snapshot = await db.collection('customers').get();
  const records = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      objectID: doc.id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      contactRoles: data.contactRoles || [],
      type: data.type || '',
      status: data.status || '',
      userId: data.userId || '',
    };
  });

  if (records.length > 0) {
    await algolia.saveObjects({ indexName: 'customers', objects: records });
    console.log(`  Indexed ${records.length} customers`);
  } else {
    console.log('  No customers found');
  }
}

async function configureIndexes() {
  console.log('Configuring Algolia index settings...');

  await algolia.setSettings({
    indexName: 'breeder_profiles',
    indexSettings: {
      searchableAttributes: ['kennelName', 'breederName', 'city', 'state', 'primaryBreed'],
      attributesForFaceting: ['filterOnly(userId)'],
    },
  });
  console.log('  Configured breeder_profiles index');

  await algolia.setSettings({
    indexName: 'dogs',
    indexSettings: {
      searchableAttributes: ['name', 'registeredName', 'registrationNumber', 'breed', 'kennelName', 'breederName'],
      attributesForFaceting: ['filterOnly(userId)', 'filterOnly(sex)', 'filterOnly(breed)'],
    },
  });
  console.log('  Configured dogs index');

  await algolia.setSettings({
    indexName: 'customers',
    indexSettings: {
      searchableAttributes: ['name', 'email', 'phone'],
      attributesForFaceting: ['filterOnly(userId)', 'filterOnly(type)', 'filterOnly(status)', 'filterOnly(contactRoles)'],
    },
  });
  console.log('  Configured customers index');
}

async function main() {
  try {
    await configureIndexes();
    await Promise.all([
      backfillBreederProfiles(),
      backfillDogs(),
      backfillCustomers(),
    ]);
    console.log('\nBackfill complete!');
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
}

main();
