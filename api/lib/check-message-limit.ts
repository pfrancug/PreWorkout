const readCount = async (url: string): Promise<number | null> => {
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }

  const raw: unknown = await res.json();

  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
};

/**
 * Increment the daily message counter via Firebase REST API (Edge-compatible).
 * DB security rules enforce mode checks, +1 increment, and the 25 cap.
 * Retries once on write failure (handles race with concurrent requests).
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

  let count = await readCount(countUrl);
  if (count === null) {
    return { allowed: false };
  }

  const writeRes = await fetch(countUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(count + 1),
  });

  if (writeRes.ok) {
    return { allowed: true };
  }

  // Retry once — count may have changed due to a concurrent request
  count = await readCount(countUrl);
  if (count === null) {
    return { allowed: false };
  }

  const retryRes = await fetch(countUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(count + 1),
  });

  return { allowed: retryRes.ok };
};
