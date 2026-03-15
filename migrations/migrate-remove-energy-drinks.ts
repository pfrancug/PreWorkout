// migrations/migrate-remove-energy-drinks.ts
// Removes energyDrinks data and drinksSugarFilter preference for all users
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../secrets/google-credentials.json'), 'utf-8'),
);

const envFile = readFileSync(join(__dirname, '../.env'), 'utf-8');
const databaseURL = envFile
  .split('\n')
  .find((line) => line.startsWith('VITE_FIREBASE_DATABASE_URL='))
  ?.split('=')[1]
  ?.trim()
  ?.replace(/^['"]|['"]$/g, '');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL,
});

const db = admin.database();

async function migrate() {
  const usersRef = db.ref('users');
  const snapshot = await usersRef.once('value');
  const users = snapshot.val();

  if (!users) {
    console.log('No users found');
    return;
  }

  const updates: Record<string, null> = {};

  for (const [uid, userData] of Object.entries(users as Record<string, any>)) {
    if (userData?.energyDrinks) {
      updates[`users/${uid}/energyDrinks`] = null;
    }
    if (userData?.preferences?.drinksSugarFilter !== undefined) {
      updates[`users/${uid}/preferences/drinksSugarFilter`] = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    console.log('Nothing to migrate');
    return;
  }

  console.log(
    `Removing energy drinks data for ${Object.keys(updates).length} paths...`,
  );
  await db.ref().update(updates);
  console.log('Done!');
}

migrate().then(() => process.exit(0));
