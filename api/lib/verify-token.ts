import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
);
const FIREBASE_ISSUER_BASE = 'https://securetoken.google.com';

const jwks = createRemoteJWKSet(FIREBASE_JWKS_URL);

export const verifyFirebaseToken = async (
  authHeader: string | null | undefined,
): Promise<string | null> => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${FIREBASE_ISSUER_BASE}/${projectId}`,
      audience: projectId,
    });

    return payload.sub ?? null;
  } catch {
    return null;
  }
};
