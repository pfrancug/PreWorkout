/**
 * One-time script to set trainer custom claims on a Firebase user.
 *
 * Usage:
 *   npx tsx scripts/set-trainer.ts <USER_UID>
 *
 * Prerequisites:
 *   1. Install firebase-admin: npm i -D firebase-admin tsx
 *   2. Download a service account key from Firebase Console:
 *      Project Settings → Service Accounts → Generate New Private Key
 *   3. Set the environment variable:
 *      $env:GOOGLE_APPLICATION_CREDENTIALS = "path/to/serviceAccountKey.json"
 *   4. Run the script with your Firebase UID.
 *
 * After running, the user must sign out and sign back in for the
 * custom claim to take effect in their auth token.
 *
 * Note: This preserves existing custom claims (e.g. admin).
 */

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = process.argv[2];

if (!uid) {
  console.error('Usage: npx tsx scripts/set-trainer.ts <USER_UID>');
  process.exit(1);
}

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error(
    'Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.',
  );
  console.error(
    'Download a service account key from Firebase Console and set:',
  );
  console.error(
    '  $env:GOOGLE_APPLICATION_CREDENTIALS = "path/to/serviceAccountKey.json"',
  );
  process.exit(1);
}

initializeApp({
  credential: cert(credPath),
});

const auth = getAuth();

try {
  // Preserve existing claims (e.g. admin)
  const existingUser = await auth.getUser(uid);
  const existingClaims = existingUser.customClaims ?? {};

  await auth.setCustomUserClaims(uid, { ...existingClaims, trainer: true });
  const user = await auth.getUser(uid);
  console.log(`✅ Trainer claim set for user: ${user.email ?? uid}`);
  console.log(`   Custom claims:`, user.customClaims);
  console.log(
    `\n⚠️  The user must sign out and sign back in for the claim to take effect.`,
  );
} catch (error) {
  console.error('Failed to set trainer claim:', error);
  process.exit(1);
}
