import type {
  UserPreferences,
  UserSettings,
} from '../contexts/SettingsContext';
import type { Message } from '@components/Chat';

import { get, getDatabase, ref, remove, set } from 'firebase/database';
import { onValue } from 'firebase/database';

import { app } from './config';

export interface DailyMessageLimit {
  date: string;
  count: number;
}

export interface AllUserData {
  settings: UserSettings | null;
  preferences: UserPreferences | null;
  messages: Message[] | null;
  data: IRowData[] | null;
  limits: DailyMessageLimit | null;
}

const database = getDatabase(app);

export const getUserSettingsRef = (userId: string) =>
  ref(database, `users/${userId}/settings`);

export const saveUserSettings = async (
  userId: string,
  settings: UserSettings,
): Promise<void> => {
  const settingsRef = getUserSettingsRef(userId);
  await set(settingsRef, settings);
};

export const loadUserSettings = async (
  userId: string,
): Promise<UserSettings | null> => {
  const settingsRef = getUserSettingsRef(userId);
  const snapshot = await get(settingsRef);

  if (snapshot.exists()) {
    return snapshot.val() as UserSettings;
  }

  return null;
};

export const getUserPreferencesRef = (userId: string) =>
  ref(database, `users/${userId}/preferences`);

export const saveUserPreferences = async (
  userId: string,
  preferences: UserPreferences,
): Promise<void> => {
  const preferencesRef = getUserPreferencesRef(userId);
  await set(preferencesRef, preferences);
};

export const loadUserPreferences = async (
  userId: string,
): Promise<UserPreferences | null> => {
  const preferencesRef = getUserPreferencesRef(userId);
  const snapshot = await get(preferencesRef);

  if (snapshot.exists()) {
    return snapshot.val() as UserPreferences;
  }

  return null;
};

export const getUserMessagesRef = (userId: string) =>
  ref(database, `users/${userId}/messages`);

export const saveUserMessages = async (
  userId: string,
  messages: Message[],
): Promise<void> => {
  // Clean messages - remove undefined values (Firebase doesn't support undefined)
  const cleanedMessages = messages.map((msg) => ({
    role: msg.role,
    parts: msg.parts,
    ...(msg.attachedDataset ? { attachedDataset: msg.attachedDataset } : {}),
  }));

  const messagesRef = getUserMessagesRef(userId);
  await set(messagesRef, cleanedMessages);
};

export const clearUserMessages = async (userId: string): Promise<void> => {
  const messagesRef = getUserMessagesRef(userId);
  await remove(messagesRef);
};

export const subscribeToUserMessages = (
  userId: string,
  callback: (messages: Message[]) => void,
): (() => void) => {
  const messagesRef = getUserMessagesRef(userId);
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const messages = Object.values(data) as Message[];
      callback(messages);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};

// User Data (diary entries)
export interface IRowData {
  id: number;
  date: string; // ISO string for Firebase storage
  weight: number | null;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export const getUserDataRef = (userId: string) =>
  ref(database, `users/${userId}/data`);

export const saveUserData = async (
  userId: string,
  data: IRowData[],
): Promise<void> => {
  const dataRef = getUserDataRef(userId);
  await set(dataRef, data);
};

export const loadUserData = async (
  userId: string,
): Promise<IRowData[] | null> => {
  const dataRef = getUserDataRef(userId);
  const snapshot = await get(dataRef);

  if (snapshot.exists()) {
    return snapshot.val() as IRowData[];
  }

  return null;
};

export const deleteAllUserData = async (userId: string): Promise<void> => {
  await Promise.all([
    remove(getUserSettingsRef(userId)),
    remove(getUserPreferencesRef(userId)),
    remove(getUserMessagesRef(userId)),
    remove(getUserDataRef(userId)),
    remove(getUserLimitsRef(userId)),
  ]);
};

export const importAllUserData = async (
  userId: string,
  data: AllUserData,
): Promise<void> => {
  const promises: Promise<void>[] = [];

  if (data.settings) {
    promises.push(saveUserSettings(userId, data.settings));
  }
  if (data.preferences) {
    promises.push(saveUserPreferences(userId, data.preferences));
  }
  if (data.messages) {
    promises.push(saveUserMessages(userId, data.messages));
  }
  if (data.data) {
    promises.push(saveUserData(userId, data.data));
  }

  await Promise.all(promises);
};

export const loadAllUserData = async (userId: string): Promise<AllUserData> => {
  const [settings, preferences, messages, data, limits] = await Promise.all([
    loadUserSettings(userId),
    loadUserPreferences(userId),
    loadUserMessages(userId),
    loadUserData(userId),
    loadDailyMessageLimit(userId),
  ]);

  return { settings, preferences, messages, data, limits };
};

const loadDailyMessageLimit = async (
  userId: string,
): Promise<DailyMessageLimit | null> => {
  const limitsRef = getUserLimitsRef(userId);
  const snapshot = await get(limitsRef);

  if (snapshot.exists()) {
    return snapshot.val() as DailyMessageLimit;
  }

  return null;
};

export const loadUserMessages = async (
  userId: string,
): Promise<Message[] | null> => {
  const messagesRef = getUserMessagesRef(userId);
  const snapshot = await get(messagesRef);

  if (snapshot.exists()) {
    return Object.values(snapshot.val()) as Message[];
  }

  return null;
};

// Daily message limits
const DAILY_MESSAGE_LIMIT = 5;

const getTodayDateString = (): string => new Date().toISOString().split('T')[0];

export const getUserLimitsRef = (userId: string) =>
  ref(database, `users/${userId}/limits`);

export const getDailyMessageCount = async (userId: string): Promise<number> => {
  const limitsRef = getUserLimitsRef(userId);
  const snapshot = await get(limitsRef);

  if (snapshot.exists()) {
    const limits = snapshot.val() as DailyMessageLimit;
    if (limits.date === getTodayDateString()) {
      return limits.count;
    }
  }

  return 0;
};

export const incrementDailyMessageCount = async (
  userId: string,
): Promise<void> => {
  const today = getTodayDateString();
  const current = await getDailyMessageCount(userId);
  const limitsRef = getUserLimitsRef(userId);
  await set(limitsRef, { date: today, count: current + 1 });
};

export const isMessageLimitReached = async (
  userId: string,
): Promise<boolean> => {
  const count = await getDailyMessageCount(userId);

  return count >= DAILY_MESSAGE_LIMIT;
};

export const getRemainingMessages = async (userId: string): Promise<number> => {
  const count = await getDailyMessageCount(userId);

  return Math.max(0, DAILY_MESSAGE_LIMIT - count);
};

export const subscribeToUserData = (
  userId: string,
  callback: (data: IRowData[] | null) => void,
): (() => void) => {
  const dataRef = getUserDataRef(userId);
  const unsubscribe = onValue(dataRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(Array.isArray(data) ? data : Object.values(data));
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};
