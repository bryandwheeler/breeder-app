/**
 * One-time script to set CORS configuration on the Firebase Storage bucket.
 * Run from the functions directory: node set-cors.js
 */
const { Storage } = require('@google-cloud/storage');

const BUCKET_NAME = 'expert-breeder.firebasestorage.app';

const corsConfig = [
  {
    origin: [
      'https://app.expertbreeder.com',
      'https://expert-breeder.web.app',
      'https://expert-breeder.firebaseapp.com',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    method: ['GET', 'HEAD'],
    maxAgeSeconds: 3600,
    responseHeader: ['Content-Type', 'Content-Length', 'Content-Range'],
  },
];

async function setCors() {
  const storage = new Storage({ projectId: 'expert-breeder' });
  const bucket = storage.bucket(BUCKET_NAME);

  try {
    await bucket.setCorsConfiguration(corsConfig);
    console.log(`CORS configuration set on bucket: ${BUCKET_NAME}`);
    console.log(JSON.stringify(corsConfig, null, 2));
  } catch (error) {
    console.error('Failed to set CORS:', error.message);
    process.exit(1);
  }
}

setCors();
