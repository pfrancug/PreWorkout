/**
 * Migration: Migrate legacy calendar/activityNotes to unified calendarEntries.
 *
 * OLD: users/{uid}/calendar/{date} = string[] (activityId array)
 *      users/{uid}/activityNotes/{date}/{activityId} = string (note)
 * NEW: users/{uid}/calendarEntries/{date}/{pushId} = CalendarEntry
 *
 * calendarNotes (day notes) are left unchanged.
 * Safe to run multiple times — already-migrated users are skipped.
 *
 * Usage:
 *   npx tsx migrations/004-calendar-entries.ts
 *
 * Prerequisites:
 *   - secrets/google-credentials.json (service account key)
 *   - .env with VITE_FIREBASE_DATABASE_URL
 */

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

if (!databaseURL) {
  console.error('VITE_FIREBASE_DATABASE_URL not found in .env');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL,
});

const db = admin.database();

async function migrate() {
  const usersSnap = await db.ref('users').once('value');
  const users = usersSnap.val() as Record<
    string,
    Record<string, unknown>
  > | null;

  if (!users) {
    console.log('No users found — nothing to do.');
    return;
  }

  const allUpdates: Record<string, unknown> = {};
  let migratedUsers = 0;
  let skippedUsers = 0;

  for (const [uid, userData] of Object.entries(users)) {
    const calendar = userData?.calendar as Record<string, string[]> | undefined;
    const activityNotes = userData?.activityNotes as
      | Record<string, Record<string, string>>
      | undefined;

    // Skip if nothing to migrate
    if (!calendar && !activityNotes) {
      skippedUsers++;
      continue;
    }

    // Skip if already migrated (calendarEntries already exists)
    if (userData?.calendarEntries) {
      console.log(`  ↩ ${uid} — already migrated, skipping`);
      skippedUsers++;
      continue;
    }

    const calendarEntries: Record<
      string,
      Record<
        string,
        {
          id: string;
          type: 'activity';
          activityId: string;
          time: null;
          note?: string;
        }
      >
    > = {};

    if (calendar) {
      for (const [date, activityIds] of Object.entries(calendar)) {
        if (!Array.isArray(activityIds) || activityIds.length === 0) continue;

        calendarEntries[date] = {};

        for (const activityId of activityIds) {
          if (typeof activityId !== 'string') continue;

          // Generate a push ID the same way Firebase would
          const pushId = db.ref().push().key!;
          const note = activityNotes?.[date]?.[activityId];

          calendarEntries[date][pushId] = {
            id: pushId,
            type: 'activity',
            activityId,
            time: null,
            ...(note ? { note } : {}),
          };
        }
      }
    }

    if (Object.keys(calendarEntries).length > 0) {
      allUpdates[`users/${uid}/calendarEntries`] = calendarEntries;
    }

    // Delete old paths
    if (calendar) allUpdates[`users/${uid}/calendar`] = null;
    if (activityNotes) allUpdates[`users/${uid}/activityNotes`] = null;

    migratedUsers++;
    console.log(
      `  ✔ ${uid} — ${Object.keys(calendarEntries).length} days migrated`,
    );
  }

  if (Object.keys(allUpdates).length === 0) {
    console.log('Nothing to migrate — all users already on new model.');
    return;
  }

  // Firebase Realtime Database update() accepts up to ~1 MB per call.
  // Batch into chunks of 500 top-level keys to stay well within limits.
  const BATCH_SIZE = 500;
  const updateKeys = Object.keys(allUpdates);

  for (let i = 0; i < updateKeys.length; i += BATCH_SIZE) {
    const batch: Record<string, unknown> = {};
    updateKeys.slice(i, i + BATCH_SIZE).forEach((k) => {
      batch[k] = allUpdates[k];
    });
    await db.ref().update(batch);
    console.log(
      `  Applied batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(updateKeys.length / BATCH_SIZE)}`,
    );
  }

  console.log(
    `\nDone. Migrated: ${migratedUsers} user(s), skipped: ${skippedUsers} user(s).`,
  );
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
