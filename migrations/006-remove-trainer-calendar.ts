/**
 * Migration: Remove trainerCalendar bridge data and trainer activity categories.
 *
 * 1. Deletes all `users/{uid}/trainerCalendar` nodes
 * 2. Deletes trainer-generated categories (items with `trainerId`)
 * 3. Strips `trainerId` and `systemGenerated` fields from remaining categories
 * 4. Verifies `trainingSessions` data is untouched
 *
 * Usage:
 *   npx tsx migrations/006-remove-trainer-calendar.ts [--dry-run]
 *
 * Prerequisites:
 *   - secrets/google-credentials.json (service account key)
 *   - .env with VITE_FIREBASE_DATABASE_URL
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

import { cert, type ServiceAccount } from 'firebase-admin/app';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// --- Config ---

const projectRoot = resolve(import.meta.dirname, '..');
const credentialsPath = resolve(
  projectRoot,
  'secrets',
  'google-credentials.json',
);
const envPath = resolve(projectRoot, '.env');

const readDatabaseUrl = (): string => {
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(
    /^VITE_FIREBASE_DATABASE_URL\s*=\s*'?([^'\r\n]+)'?/m,
  );

  if (!match?.[1]) {
    console.error('Error: VITE_FIREBASE_DATABASE_URL not found in .env');
    process.exit(1);
  }

  return match[1];
};

const databaseURL = readDatabaseUrl();
const serviceAccount = JSON.parse(
  readFileSync(credentialsPath, 'utf-8'),
) as ServiceAccount;
const dryRun = process.argv.includes('--dry-run');

// --- Init Firebase ---

console.log(`Database: ${databaseURL}`);
console.log(`Credentials: ${credentialsPath}`);
console.log(`Dry run: ${dryRun}\n`);

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL,
});
const db = getDatabase(app);

// --- Types ---

interface CategoryItem {
  id: string;
  icon: string;
  name: string;
  color: string;
  trainerId?: string;
  systemGenerated?: boolean;
  archived?: boolean;
}

// --- Migration ---

const run = async () => {
  if (dryRun) {
    console.log('=== DRY RUN MODE — no changes will be written ===\n');
  }

  console.log('Fetching all users...');
  const usersSnap = await db.ref('users').once('value');
  const users = usersSnap.val() as Record<
    string,
    Record<string, unknown>
  > | null;

  if (!users) {
    console.log('No users found. Nothing to migrate.');

    return;
  }

  const userIds = Object.keys(users);
  console.log(`Found ${userIds.length} user(s).\n`);

  let trainerCalendarDeleted = 0;
  let categoriesDeleted = 0;
  let fieldsStripped = 0;

  for (const uid of userIds) {
    const userData = users[uid];

    // 1. Delete trainerCalendar
    if (userData.trainerCalendar) {
      const dateCount = Object.keys(userData.trainerCalendar as object).length;
      console.log(`  [${uid}] Deleting trainerCalendar (${dateCount} date(s))`);

      if (!dryRun) {
        await db.ref(`users/${uid}/trainerCalendar`).remove();
      }

      trainerCalendarDeleted++;
    }

    // 2. Clean up activityCategories
    const catData = userData.activityCategories as {
      _initialized?: boolean;
      items?: CategoryItem[];
    } | null;

    if (catData?.items && Array.isArray(catData.items)) {
      const updatedItems: CategoryItem[] = [];
      let modified = false;

      for (const item of catData.items) {
        if (item.trainerId) {
          console.log(
            `  [${uid}] Deleting trainer category: "${item.name}" (trainerId: ${item.trainerId})`,
          );
          categoriesDeleted++;
          modified = true;
        } else {
          const { trainerId, systemGenerated, ...clean } = item;

          if (trainerId !== undefined || systemGenerated !== undefined) {
            fieldsStripped++;
            modified = true;
          }

          updatedItems.push(clean);
        }
      }

      if (modified) {
        console.log(`  [${uid}] Updating activityCategories items`);

        if (!dryRun) {
          await db
            .ref(`users/${uid}/activityCategories/items`)
            .set(updatedItems);
        }
      }
    }
  }

  // 3. Verify trainingSessions are intact
  console.log('\nVerifying trainingSessions...');
  const sessionsSnap = await db.ref('trainingSessions').once('value');

  if (sessionsSnap.exists()) {
    const sessions = sessionsSnap.val() as Record<
      string,
      Record<string, unknown>
    >;
    let totalSessions = 0;

    for (const connSessions of Object.values(sessions)) {
      totalSessions += Object.keys(connSessions).length;
    }

    console.log(
      `  trainingSessions intact: ${Object.keys(sessions).length} connection(s), ${totalSessions} total session(s)`,
    );
  } else {
    console.log(
      '  No trainingSessions found (OK if no trainer connections exist).',
    );
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`  trainerCalendar nodes deleted: ${trainerCalendarDeleted}`);
  console.log(`  Trainer categories deleted:    ${categoriesDeleted}`);
  console.log(`  Obsolete fields stripped:      ${fieldsStripped}`);

  if (dryRun) {
    console.log(
      '\nDry run complete. Re-run without --dry-run to apply changes.',
    );
  } else {
    console.log('\nMigration complete.');
  }

  process.exit(0);
};

run().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
