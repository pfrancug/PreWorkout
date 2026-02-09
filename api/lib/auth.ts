import {
  type ServiceAccount,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const getAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccount) as ServiceAccount),
    });
  }

  // Fallback: use project ID with Application Default Credentials
  return initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
};

const adminApp = getAdminApp();
const adminAuth = getAuth(adminApp);

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
