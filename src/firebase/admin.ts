import type { MessageLimitMode } from './types';

import { get, ref, set } from 'firebase/database';

import { database } from './db';
import { getUserLimitsRef } from './message-limits';

const DEFAULT_MODE: MessageLimitMode = 'limited';

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getUserLimitModeForAdmin = async (
  userId: string,
): Promise<MessageLimitMode> => {
  const snapshot = await get(getUserLimitsRef(userId));

  return snapshot.exists()
    ? (snapshot.val().mode ?? DEFAULT_MODE)
    : DEFAULT_MODE;
};

export const setUserLimitModeForAdmin = async (
  userId: string,
  mode: MessageLimitMode,
): Promise<void> => {
  await set(getUserLimitsRef(userId), { mode });
};

export const getUserUsageStats = async (
  userId: string,
): Promise<{
  todayMessages: number;
  totalMessages: number;
  averageDaily: number;
  allTimeTotal: number;
} | null> => {
  const today = getTodayDateString();
  const todayDate = new Date();
  const thirtyDaysAgo = new Date(
    todayDate.getTime() - 30 * 24 * 60 * 60 * 1000,
  );

  const sendsSnapshot = await get(
    ref(database, `userDirectory/${userId}/messageSends`),
  );

  if (!sendsSnapshot.exists()) {
    return null;
  }

  const sendsData = sendsSnapshot.val() as Record<
    string,
    Record<string, number>
  >;

  let allTimeTotal = 0;
  let totalMessages = 0;
  let todayMessages = 0;
  let daysWithMessages = 0;

  // Single pass through all messageSends data
  for (const [yearMonth, days] of Object.entries(sendsData)) {
    for (const [day, count] of Object.entries(days)) {
      allTimeTotal += count;

      const dateStr = `${yearMonth}-${day}`;

      if (dateStr === today) {
        todayMessages = count;
      }

      const date = new Date(dateStr);
      if (date >= thirtyDaysAgo && date <= todayDate) {
        totalMessages += count;
        daysWithMessages++;
      }
    }
  }

  const averageDaily =
    daysWithMessages > 0 ? totalMessages / daysWithMessages : 0;

  return {
    todayMessages,
    totalMessages,
    averageDaily,
    allTimeTotal,
  };
};
