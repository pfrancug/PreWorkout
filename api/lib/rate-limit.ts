import admin from 'firebase-admin';

const DEFAULT_DAILY_LIMIT = 5;

interface LimitsData {
  count: number;
  max?: number;
  lastUpdated: number;
}

/**
 * Check if user has exceeded their daily message limit.
 * Returns { allowed: true, remaining } or { allowed: false, remaining: 0 }.
 */
export const checkRateLimit = async (
  uid: string,
): Promise<{ allowed: boolean; remaining: number }> => {
  const db = admin.database();
  const limitsRef = db.ref(`users/${uid}/limits`);
  const snapshot = await limitsRef.get();

  if (!snapshot.exists()) {
    // No limits data yet — first message ever, allow it
    return { allowed: true, remaining: DEFAULT_DAILY_LIMIT - 1 };
  }

  const limits = snapshot.val() as LimitsData;
  const max = limits.max ?? DEFAULT_DAILY_LIMIT;

  // -1 means unlimited
  if (max === -1) {
    return { allowed: true, remaining: Infinity };
  }

  const today = new Date().toISOString().split('T')[0];
  const limitsDate = new Date(limits.lastUpdated).toISOString().split('T')[0];

  // New day — counter will be reset, allow
  if (limitsDate !== today) {
    return { allowed: true, remaining: max - 1 };
  }

  const remaining = Math.max(0, max - limits.count);

  return { allowed: limits.count < max, remaining: Math.max(0, remaining - 1) };
};
