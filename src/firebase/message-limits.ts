import type { IMessageLimitConfig } from './types';

import { get, ref } from 'firebase/database';

import { database } from './db';

const DAILY_MESSAGE_LIMIT = 5;

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getUserLimitsRef = (userId: string) =>
  ref(database, `users/${userId}/limits`);

const getUserMaxLimit = async (userId: string): Promise<number> => {
  const snapshot = await get(getUserLimitsRef(userId));

  return snapshot.exists()
    ? (snapshot.val().max ?? DAILY_MESSAGE_LIMIT)
    : DAILY_MESSAGE_LIMIT;
};

export const loadMessageLimitConfig = async (
  userId: string,
): Promise<IMessageLimitConfig | null> => {
  const limitsRef = getUserLimitsRef(userId);
  const snapshot = await get(limitsRef);

  if (snapshot.exists()) {
    const val = snapshot.val();

    return { max: val.max ?? DAILY_MESSAGE_LIMIT };
  }

  return null;
};

const getTodayMessageCount = async (userId: string): Promise<number> => {
  const today = getTodayDateString();
  const yearMonth = today.substring(0, 7);
  const day = today.substring(8);
  const snapshot = await get(
    ref(database, `userDirectory/${userId}/messageSends/${yearMonth}/${day}`),
  );

  return snapshot.exists() ? (snapshot.val() as number) : 0;
};

export const isMessageLimitReached = async (
  userId: string,
): Promise<boolean> => {
  const [count, max] = await Promise.all([
    getTodayMessageCount(userId),
    getUserMaxLimit(userId),
  ]);

  if (max === -1) {
    return false;
  }

  return count >= max;
};

export const getRemainingMessages = async (userId: string): Promise<number> => {
  const [count, max] = await Promise.all([
    getTodayMessageCount(userId),
    getUserMaxLimit(userId),
  ]);

  if (max === -1) {
    return Infinity;
  }

  return Math.max(0, max - count);
};
