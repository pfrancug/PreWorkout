import admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL;

  // Try parsing from env var first
  if (serviceAccount) {
    try {
      const cleaned = serviceAccount.replace(/\\n/g, '\n');
      const parsed = JSON.parse(cleaned);
      return admin.initializeApp({
        credential: admin.credential.cert(parsed),
        databaseURL,
      });
    } catch {
      // Env var may be malformed locally — fall through to file-based loading
    }
  }

  // Fallback: load from service account JSON file (local development)
  const credentialPaths = [
    resolve(process.cwd(), 'secrets/google-credentials.json'),
    resolve(__dirname, '../../secrets/google-credentials.json'),
  ];

  for (const credPath of credentialPaths) {
    if (existsSync(credPath)) {
      try {
        const fileContent = readFileSync(credPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        return admin.initializeApp({
          credential: admin.credential.cert(parsed),
          databaseURL,
        });
      } catch {
        // Continue to next path
      }
    }
  }

  // Last resort: Application Default Credentials
  return admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    databaseURL,
  });
};

const adminApp = getAdminApp();

export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.database(adminApp);

/**
 * Verifies a Firebase ID token from the Authorization header.
 * Returns the decoded token's UID, or null if invalid/missing.
 */
export const verifyAuthToken = async (
  authHeader: string | undefined,
): Promise<string | null> => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.slice(7);

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
};
