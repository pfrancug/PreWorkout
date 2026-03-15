import { getAdminDb } from './auth.js';

const DEFAULT_DAILY_LIMIT = 5;

/**
 * Check if user has exceeded their daily message limit.
 * Reads max from users/{uid}/limits and today's count from userDirectory/{uid}/messageSends.
 * If allowed, atomically increments the count (server-side only).
 */
export const checkRateLimit = async (
  uid: string,
): Promise<{ allowed: boolean; remaining: number }> => {
  const db = getAdminDb();
  const today = new Date().toISOString().split('T')[0];
  const yearMonth = today.substring(0, 7);
  const day = today.substring(8);

  const countRef = db.ref(
    `userDirectory/${uid}/messageSends/${yearMonth}/${day}`,
  );

  const [limitsSnap, countsSnap] = await Promise.all([
    db.ref(`users/${uid}/limits`).get(),
    countRef.get(),
  ]);

  const max = limitsSnap.exists()
    ? (limitsSnap.val().max ?? DEFAULT_DAILY_LIMIT)
    : DEFAULT_DAILY_LIMIT;
  const count = countsSnap.exists() ? (countsSnap.val() as number) : 0;

  // -1 means unlimited
  if (max === -1) {
    await countRef.transaction((c: number | null) => (c ?? 0) + 1);

    return { allowed: true, remaining: Infinity };
  }

  if (count >= max) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count server-side (Admin SDK bypasses security rules)
  await countRef.transaction((c: number | null) => (c ?? 0) + 1);

  return { allowed: true, remaining: Math.max(0, max - count - 1) };
};
