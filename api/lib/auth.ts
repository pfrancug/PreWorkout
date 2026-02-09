import admin from 'firebase-admin';

const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount);
      return admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
    }
  }

  // Fallback: use project ID with Application Default Credentials
  return admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
};

const adminApp = getAdminApp();

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
    const decoded = await admin.auth(adminApp).verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
};
