/**
 * Script to seed default puppy care task templates
 * Usage: node scripts/seedDefaultTasks.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.development') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const defaultTasks = [
  // Day 0
  { title: 'Birth & Initial Care', description: 'Ensure all puppies are nursing properly and temperature control at 85-90°F', dayOrWeek: 0, frequency: 'once', category: 'care', sortOrder: 1 },

  // Days 1-3
  { title: 'Dewclaw Removal Window', description: 'Optional dewclaw removal (consult vet)', dayOrWeek: 1, frequency: 'once', category: 'health', sortOrder: 2 },
  { title: 'Weight Checks', description: 'Weigh puppies twice daily to monitor growth', dayOrWeek: 1, frequency: 'daily', category: 'health', sortOrder: 3 },

  // Days 3-16 (ENS period)
  { title: 'Early Neurological Stimulation (ENS)', description: 'Perform 5 ENS exercises daily: tactical stimulation, head held erect, head pointed down, supine position, thermal stimulation', dayOrWeek: 3, frequency: 'daily', category: 'training', sortOrder: 4 },
  { title: 'Early Scent Introduction (ESI)', description: 'Optional: Introduce different scents daily', dayOrWeek: 3, frequency: 'daily', category: 'training', sortOrder: 5 },

  // Week 1
  { title: 'Monitor Nursing', description: 'Ensure all puppies are nursing well and gaining weight', dayOrWeek: 1, frequency: 'daily', category: 'care', sortOrder: 6 },
  { title: 'Trim Nails', description: 'First nail trim to prevent scratching dam', dayOrWeek: 7, frequency: 'weekly', category: 'care', sortOrder: 7 },
  { title: 'Clean Bedding', description: 'Change and clean bedding materials', dayOrWeek: 7, frequency: 'daily', category: 'care', sortOrder: 8 },

  // Week 2
  { title: 'Eyes Opening Check', description: 'Monitor puppies as eyes begin to open', dayOrWeek: 2, frequency: 'daily', category: 'health', sortOrder: 9 },
  { title: 'Weekly Nail Trim', description: 'Continue weekly nail trimming', dayOrWeek: 2, frequency: 'weekly', category: 'care', sortOrder: 10 },

  // Week 3
  { title: 'First Deworming', description: 'Administer first deworming treatment (Day 14-21)', dayOrWeek: 3, frequency: 'once', category: 'health', sortOrder: 11 },
  { title: 'Litter Box Training', description: 'Begin introducing litter box or potty area', dayOrWeek: 3, frequency: 'daily', category: 'training', sortOrder: 12 },

  // Week 4
  { title: 'Introduce Water & Gruel', description: 'Start offering water and puppy gruel', dayOrWeek: 4, frequency: 'daily', category: 'care', sortOrder: 13 },
  { title: 'Second Deworming', description: 'Administer second deworming treatment', dayOrWeek: 4, frequency: 'once', category: 'health', sortOrder: 14 },
  { title: 'Begin Weaning', description: 'Start transitioning puppies from nursing to solid food', dayOrWeek: 4, frequency: 'daily', category: 'care', sortOrder: 15 },

  // Week 5
  { title: 'Sound Exposure', description: 'Introduce various household sounds and noises', dayOrWeek: 5, frequency: 'daily', category: 'training', sortOrder: 16 },
  { title: 'Toy Introduction', description: 'Provide age-appropriate toys for play and development', dayOrWeek: 5, frequency: 'daily', category: 'training', sortOrder: 17 },
  { title: 'Group Crate Training', description: 'Begin positive crate exposure with littermates', dayOrWeek: 5, frequency: 'daily', category: 'training', sortOrder: 18 },

  // Week 6
  { title: 'Third Deworming', description: 'Administer third deworming treatment', dayOrWeek: 6, frequency: 'once', category: 'health', sortOrder: 19 },
  { title: 'First DA2PP Vaccine', description: 'First vaccination (consult vet for timing)', dayOrWeek: 6, frequency: 'once', category: 'vaccination', sortOrder: 20 },
  { title: 'Fecal Exam', description: 'Collect stool sample for fecal examination', dayOrWeek: 6, frequency: 'once', category: 'health', sortOrder: 21 },

  // Week 7
  { title: 'Microchip Implantation', description: 'Microchip each puppy and record numbers', dayOrWeek: 7, frequency: 'once', category: 'health', sortOrder: 22 },
  { title: 'Temperament Evaluations', description: 'Conduct Volhard or other temperament testing', dayOrWeek: 7, frequency: 'once', category: 'training', sortOrder: 23 },

  // Week 8
  { title: 'Final Vet Health Check', description: 'Complete vet examination before go-home', dayOrWeek: 8, frequency: 'once', category: 'health', sortOrder: 24 },
  { title: 'Health Certificates', description: 'Obtain health certificates for each puppy', dayOrWeek: 8, frequency: 'once', category: 'health', sortOrder: 25 },
  { title: 'Go-Home Preparation', description: 'Prepare puppy packets, records, and supplies', dayOrWeek: 8, frequency: 'once', category: 'general', sortOrder: 26 },

  // Weeks 9-12 (Owner responsibility reminders)
  { title: 'Booster Vaccine Reminder', description: 'Remind new owners about booster vaccinations', dayOrWeek: 9, frequency: 'once', category: 'vaccination', sortOrder: 27 },
  { title: 'Optional Final Deworming', description: 'Optional fourth deworming (owner to coordinate with vet)', dayOrWeek: 10, frequency: 'once', category: 'health', sortOrder: 28 },
];

async function seedDefaultTasks() {
  try {
    console.log('Starting to seed default task templates...');
    console.log(`Using project: ${firebaseConfig.projectId}`);

    const templatesRef = collection(db, 'taskTemplates', 'defaults', 'templates');

    // Check if templates already exist
    const existingTemplates = await getDocs(templatesRef);
    if (!existingTemplates.empty) {
      console.log(`⚠️  Found ${existingTemplates.size} existing templates.`);
      console.log('Delete existing templates first or modify the script to update them.');
      process.exit(0);
    }

    // Add all default templates
    for (const task of defaultTasks) {
      const docRef = doc(templatesRef);
      await setDoc(docRef, {
        id: docRef.id,
        ...task,
        isActive: true,
        createdBy: 'system',
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Created: ${task.title}`);
    }

    console.log(`\n✅ Successfully seeded ${defaultTasks.length} default task templates!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding default tasks:', error);
    process.exit(1);
  }
}

seedDefaultTasks();
