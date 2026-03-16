/**
 * Migration: Strip legacy `count` and `lastUpdated` fields from limits, keeping only `max`.
 *
 * 1. Reads every `users/{uid}/limits` node
 * 2. Removes `count` and `lastUpdated` fields while preserving `max`
 * 3. If `max` is missing, sets it to the default (5)
 *
 * Safe to run multiple times — already-clean nodes are skipped.
 *
 * Usage:
 *   npx tsx migrations/002-strip-limits.ts
 *
 * Prerequisites:
 *   - secrets/google-credentials.json (service account key)
 *   - .env with VITE_FIREBASE_DATABASE_URL
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const DEFAULT_MAX = 5;

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
  const usersSnap = await db.ref('users').once('value');

  if (!usersSnap.exists()) {
    console.log('No users found in database. Nothing to migrate.');
    process.exit(0);
  }

  const users = usersSnap.val() as Record<
    string,
    { limits?: Record<string, unknown> }
  >;

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [uid, userData] of Object.entries(users)) {
    const limits = userData.limits;

    if (!limits) {
      skipped++;
      continue;
    }

    const hasLegacy = 'count' in limits || 'lastUpdated' in limits;

    if (!hasLegacy) {
      skipped++;
      continue;
    }

    const max = typeof limits.max === 'number' ? limits.max : DEFAULT_MAX;

    try {
      await db.ref(`users/${uid}/limits`).set({ max });
      migrated++;
      console.log(`✅ ${uid} — cleaned limits (max: ${max})`);
    } catch (error) {
      failed++;
      console.error(`❌ ${uid} — failed:`, error);
    }
  }

  console.log(
    `\nDone. Migrated: ${migrated}, Skipped: ${skipped}, Failed: ${failed}`,
  );
}

migrate().then(() => process.exit(0));
