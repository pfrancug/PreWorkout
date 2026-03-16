const DAILY_LIMIT = 25;

/**
 * Check whether a user has reached their daily message limit.
 * Uses the Firebase REST API with the user's ID token (Edge-compatible).
 *
 * Returns { allowed: true } if the user can send a message,
 * or { allowed: false } if the limit is reached or the user is disabled.
 */
export const checkMessageLimit = async (
  uid: string,
  idToken: string,
): Promise<{ allowed: boolean }> => {
  const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL;
  if (!databaseURL) {
    return { allowed: false };
  }

  const baseUrl = databaseURL.replace(/\/$/, '');

  const modeRes = await fetch(
    `${baseUrl}/users/${uid}/limits/mode.json?auth=${idToken}`,
  );

  if (!modeRes.ok) {
    return { allowed: false };
  }

  const mode: string | null = await modeRes.json();

  if (mode === 'disabled') {
    return { allowed: false };
  }

  if (mode === 'unlimited') {
    return { allowed: true };
  }

  // mode === 'limited' or no config (default to limited)
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const day = String(now.getDate()).padStart(2, '0');

  const countRes = await fetch(
    `${baseUrl}/userDirectory/${uid}/messageSends/${yearMonth}/${day}.json?auth=${idToken}`,
  );

  if (!countRes.ok) {
    return { allowed: false };
  }

  const count: number | null = await countRes.json();

  return { allowed: (count ?? 0) < DAILY_LIMIT };
};
