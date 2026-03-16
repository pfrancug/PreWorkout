import type { IMessageLimitConfig, MessageLimitMode } from './types';

import { get, ref } from 'firebase/database';

import { database } from './db';

const DAILY_LIMIT = 25;
const DEFAULT_MODE: MessageLimitMode = 'limited';

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getUserLimitsRef = (userId: string) =>
  ref(database, `users/${userId}/limits`);

const getUserLimitMode = async (userId: string): Promise<MessageLimitMode> => {
  const snapshot = await get(getUserLimitsRef(userId));

  return snapshot.exists()
    ? (snapshot.val().mode ?? DEFAULT_MODE)
    : DEFAULT_MODE;
};

export const loadMessageLimitConfig = async (
  userId: string,
): Promise<IMessageLimitConfig | null> => {
  const limitsRef = getUserLimitsRef(userId);
  const snapshot = await get(limitsRef);

  if (snapshot.exists()) {
    const val = snapshot.val();

    return { mode: val.mode ?? DEFAULT_MODE };
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
  const mode = await getUserLimitMode(userId);

  if (mode === 'disabled') {
    return true;
  }

  if (mode === 'unlimited') {
    return false;
  }

  const count = await getTodayMessageCount(userId);

  return count >= DAILY_LIMIT;
};

export const getRemainingMessages = async (userId: string): Promise<number> => {
  const mode = await getUserLimitMode(userId);

  if (mode === 'disabled') {
    return 0;
  }

  if (mode === 'unlimited') {
    return Infinity;
  }

  const count = await getTodayMessageCount(userId);

  return Math.max(0, DAILY_LIMIT - count);
};
