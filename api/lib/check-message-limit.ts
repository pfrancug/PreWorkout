/**
 * Increment the daily message counter via Firebase REST API (Edge-compatible).
 * DB security rules enforce mode checks, +1 increment, and the 25 cap.
 * Returns { allowed: true } if the write was accepted.
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
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const day = String(now.getDate()).padStart(2, '0');
  const countUrl = `${baseUrl}/userDirectory/${uid}/messageSends/${yearMonth}/${day}.json?auth=${idToken}`;

  const countRes = await fetch(countUrl);
  if (!countRes.ok) {
    return { allowed: false };
  }

  const count: number | null = await countRes.json();

  const writeRes = await fetch(countUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify((count ?? 0) + 1),
  });

  return { allowed: writeRes.ok };
};
