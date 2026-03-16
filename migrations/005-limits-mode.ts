/**
 * Migration: Convert limits from { max: number } to { mode: 'disabled' | 'limited' | 'unlimited' }
 *
 * Mapping:
 *   max === -1  → mode: 'unlimited'
 *   max === 0   → mode: 'disabled'
 *   max > 0     → mode: 'limited'
 *   no limits   → no change (defaults to 'limited' in app code)
 *
 * Usage:
 *   npx tsx migrations/005-limits-mode.ts
 *   npx tsx migrations/005-limits-mode.ts --dry-run
 *
 * Prerequisites:
 *   - secrets/google-credentials.json (service account key)
 *   - .env with VITE_FIREBASE_DATABASE_URL
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cert, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const credentialsPath = resolve('secrets/google-credentials.json');
let serviceAccount: Record<string, string>;
try {
  serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf-8'));
} catch {
  console.error(
    `Error: Could not read service account credentials from ${credentialsPath}`,
  );
  process.exit(1);
}

const envFile = readFileSync(resolve('.env'), 'utf-8');
const dbUrlMatch = envFile.match(/VITE_FIREBASE_DATABASE_URL=(.+)/);
const databaseURL = dbUrlMatch?.[1]?.trim().replace(/^['"]|['"]$/g, '');
if (!databaseURL) {
  console.error('Error: VITE_FIREBASE_DATABASE_URL not found in .env file.');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL,
});

const db = getDatabase();

const mapMaxToMode = (max: number): 'disabled' | 'limited' | 'unlimited' => {
  if (max === -1) {
    return 'unlimited';
  }
  if (max === 0) {
    return 'disabled';
  }

  return 'limited';
};

const migrate = async () => {
  console.log(dryRun ? '=== DRY RUN ===' : '=== MIGRATING ===');

  const usersSnap = await db.ref('users').once('value');
  const users = usersSnap.val() as Record<
    string,
    { limits?: { max?: number } }
  > | null;

  if (!users) {
    console.log('No users found. Nothing to migrate.');

    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const [uid, userData] of Object.entries(users)) {
    const limits = userData.limits;

    if (!limits || limits.max === undefined) {
      skipped++;
      continue;
    }

    const oldMax = limits.max;
    const newMode = mapMaxToMode(oldMax);

    console.log(`  ${uid}: max=${oldMax} → mode=${newMode}`);

    if (!dryRun) {
      await db.ref(`users/${uid}/limits`).set({ mode: newMode });
    }

    migrated++;
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped (no limits): ${skipped}`);
};

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
