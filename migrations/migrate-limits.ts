/**
 * One-time migration: strip legacy `count` and `lastUpdated` fields from
 * `users/{uid}/limits`, keeping only `max`.
 *
 * Background:
 *   Previously every message send wrote both to `users/{uid}/limits`
 *   (count, max, lastUpdated) and `userDirectory/{uid}/messageSends`.
 *   After the simplification refactor, `limits` stores only `{ max }`
 *   and `messageSends` is the single source of truth for all counts.
 *
 * What this script does:
 *   1. Reads every `users/{uid}/limits` node.
 *   2. If a node contains `count` or `lastUpdated`, removes those fields
 *      while preserving `max`.
 *   3. If `max` is missing, sets it to the default (5).
 *   4. Prints a summary of migrated / skipped / failed users.
 *
 * Usage:
 *   npx tsx migrations/migrate-limits.ts
 *
 * Prerequisites:
 *   1. Install firebase-admin & tsx:  npm i -D firebase-admin tsx
 *   2. Place your service account key at secrets/google-credentials.json
 *
 * Safe to run multiple times — already-clean nodes are skipped.
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
