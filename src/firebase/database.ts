import type {
  UserPreferences,
  UserSettings,
} from '../contexts/SettingsContext';
import type { Message } from '@components/Chat';

import {
  get,
  getDatabase,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from 'firebase/database';
import { onValue } from 'firebase/database';

import { app } from './config';

export interface DailyMessageLimit {
  count: number;
  max?: number;
  lastUpdated: number; // Unix timestamp, used to determine the current day
}

export interface MessageUsageHistory {
  date: string;
  count: number;
  max: number;
}

export type CalendarActivity = string;

export interface ActivityCategory {
  id: string;
  icon: string;
  name: string;
  color: string;
}

export interface CalendarData {
  [date: string]: CalendarActivity[];
}

export interface CalendarNotes {
  [date: string]: string;
}

export interface AllUserData {
  settings: UserSettings | null;
  preferences: UserPreferences | null;
  messages: Message[] | null;
  data: IRowData[] | null;
  limits: DailyMessageLimit | null;
  calendar: CalendarData | null;
  calendarNotes: CalendarNotes | null;
  activityCategories: ActivityCategory[] | null;
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
  completed?: boolean;
}

export const getUserDataRef = (userId: string) =>
  ref(database, `users/${userId}/data`);

export const saveUserData = async (
  userId: string,
  data: IRowData[],
): Promise<void> => {
  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const dataRef = getUserDataRef(userId);
  await set(dataRef, sorted);
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

/**
 * Deletes all user data from the database.
 *
 * GDPR Compliance Note:
 * - Deletes all personal identifiable information (PII)
 * - Removes PII fields from userDirectory (email, displayName, lastLogin)
 * - Retains userDirectory/{uid}/messageSends for anonymized analytics (GDPR Article 89)
 * - Once Firebase Auth account is deleted, userId becomes a pseudonymous
 *   identifier that cannot be linked back to the individual
 */
export const deleteAllUserData = async (userId: string): Promise<void> => {
  await Promise.all([
    remove(getUserSettingsRef(userId)),
    remove(getUserPreferencesRef(userId)),
    remove(getUserMessagesRef(userId)),
    remove(getUserDataRef(userId)),
    remove(getUserLimitsRef(userId)),
    remove(getUserCalendarRef(userId)),
    remove(getUserCalendarNotesRef(userId)),
    remove(getActivityCategoriesRef(userId)),
    // Remove only PII fields from userDirectory, keep analytics (messageSends)
    remove(ref(database, `userDirectory/${userId}/email`)),
    remove(ref(database, `userDirectory/${userId}/displayName`)),
    remove(ref(database, `userDirectory/${userId}/lastLogin`)),
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
  if (data.limits) {
    promises.push(set(getUserLimitsRef(userId), data.limits));
  }
  if (data.calendar) {
    promises.push(set(getUserCalendarRef(userId), data.calendar));
  }
  if (data.calendarNotes) {
    promises.push(set(getUserCalendarNotesRef(userId), data.calendarNotes));
  }
  if (data.activityCategories) {
    promises.push(saveActivityCategories(userId, data.activityCategories));
  }

  await Promise.all(promises);
};

export const loadAllUserData = async (userId: string): Promise<AllUserData> => {
  const [
    settings,
    preferences,
    messages,
    data,
    limits,
    calendar,
    calendarNotes,
    activityCategories,
  ] = await Promise.all([
    loadUserSettings(userId),
    loadUserPreferences(userId),
    loadUserMessages(userId),
    loadUserData(userId),
    loadDailyMessageLimit(userId),
    loadCalendarData(userId),
    loadCalendarNotes(userId),
    loadActivityCategories(userId),
  ]);

  return {
    settings,
    preferences,
    messages,
    data,
    limits,
    calendar,
    calendarNotes,
    activityCategories,
  };
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

const getDateStringFromTimestamp = (timestamp: number): string =>
  new Date(timestamp).toISOString().split('T')[0];

export const getUserLimitsRef = (userId: string) =>
  ref(database, `users/${userId}/limits`);

// Helper to get full limits data with validation
const getUserLimits = async (
  userId: string,
): Promise<DailyMessageLimit | null> => {
  const limitsRef = getUserLimitsRef(userId);
  const snapshot = await get(limitsRef);

  if (snapshot.exists()) {
    const limits = snapshot.val() as DailyMessageLimit;
    const today = getTodayDateString();
    const limitsDate = getDateStringFromTimestamp(limits.lastUpdated);

    // Reset if it's a new day
    if (limitsDate !== today) {
      // Atomically reset the counter for the new day
      const resetData: DailyMessageLimit = {
        count: 0,
        max: limits.max ?? DAILY_MESSAGE_LIMIT,
        lastUpdated: Date.now(),
      };
      await set(limitsRef, resetData);

      return resetData;
    }

    return limits;
  }

  return null;
};

export const getDailyMessageCount = async (userId: string): Promise<number> => {
  const limits = await getUserLimits(userId);

  return limits?.count ?? 0;
};

export const incrementDailyMessageCount = async (
  userId: string,
): Promise<void> => {
  const limitsRef = getUserLimitsRef(userId);
  const timestamp = Date.now();
  const today = getTodayDateString();

  // Atomically increment the daily limit counter
  await runTransaction(limitsRef, (currentData: DailyMessageLimit | null) => {
    if (!currentData) {
      return {
        count: 1,
        max: DAILY_MESSAGE_LIMIT,
        lastUpdated: timestamp,
      };
    }

    const limitsDate = getDateStringFromTimestamp(currentData.lastUpdated);

    // New day — reset counter
    if (limitsDate !== today) {
      return {
        count: 1,
        max: currentData.max ?? DAILY_MESSAGE_LIMIT,
        lastUpdated: timestamp,
      };
    }

    return {
      count: (currentData.count ?? 0) + 1,
      max: currentData.max ?? DAILY_MESSAGE_LIMIT,
      lastUpdated: timestamp,
    };
  });

  // Atomically increment the real-time analytics counter
  const yearMonth = today.substring(0, 7); // "2026-02"
  const day = today.substring(8); // "09"
  const logRef = ref(
    database,
    `userDirectory/${userId}/messageSends/${yearMonth}/${day}`,
  );

  await runTransaction(logRef, (currentCount: number | null) => {
    return (currentCount ?? 0) + 1;
  });
};

export const isMessageLimitReached = async (
  userId: string,
): Promise<boolean> => {
  const limits = await getUserLimits(userId);
  const count = limits?.count ?? 0;
  const max = limits?.max ?? DAILY_MESSAGE_LIMIT;

  // -1 means unlimited
  if (max === -1) {
    return false;
  }

  return count >= max;
};

export const getRemainingMessages = async (userId: string): Promise<number> => {
  const limits = await getUserLimits(userId);
  const count = limits?.count ?? 0;
  const max = limits?.max ?? DAILY_MESSAGE_LIMIT;

  // -1 means unlimited
  if (max === -1) {
    return Infinity;
  }

  return Math.max(0, max - count);
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

// Calendar
export const getUserCalendarRef = (userId: string) =>
  ref(database, `users/${userId}/calendar`);

export const loadCalendarData = async (
  userId: string,
): Promise<CalendarData | null> => {
  const calendarRef = getUserCalendarRef(userId);
  const snapshot = await get(calendarRef);

  if (snapshot.exists()) {
    return snapshot.val() as CalendarData;
  }

  return null;
};

export const saveCalendarDay = async (
  userId: string,
  date: string,
  activities: CalendarActivity[],
): Promise<void> => {
  const dayRef = ref(database, `users/${userId}/calendar/${date}`);

  if (activities.length === 0) {
    await remove(dayRef);
  } else {
    await set(dayRef, activities);
  }
};

export const subscribeToCalendarData = (
  userId: string,
  callback: (data: CalendarData | null) => void,
): (() => void) => {
  const calendarRef = getUserCalendarRef(userId);
  const unsubscribe = onValue(calendarRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as CalendarData);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

// Calendar Notes
export const getUserCalendarNotesRef = (userId: string) =>
  ref(database, `users/${userId}/calendarNotes`);

export const loadCalendarNotes = async (
  userId: string,
): Promise<CalendarNotes | null> => {
  const notesRef = getUserCalendarNotesRef(userId);
  const snapshot = await get(notesRef);

  if (snapshot.exists()) {
    return snapshot.val() as CalendarNotes;
  }

  return null;
};

export const saveCalendarNote = async (
  userId: string,
  date: string,
  note: string,
): Promise<void> => {
  const noteRef = ref(database, `users/${userId}/calendarNotes/${date}`);

  if (!note.trim()) {
    await remove(noteRef);
  } else {
    await set(noteRef, note.trim());
  }
};

export const subscribeToCalendarNotes = (
  userId: string,
  callback: (data: CalendarNotes | null) => void,
): (() => void) => {
  const notesRef = getUserCalendarNotesRef(userId);
  const unsubscribe = onValue(notesRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as CalendarNotes);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

// Activity Categories
export const getActivityCategoriesRef = (userId: string) =>
  ref(database, `users/${userId}/activityCategories`);

export const saveActivityCategories = async (
  userId: string,
  categories: ActivityCategory[],
): Promise<void> => {
  const categoriesRef = getActivityCategoriesRef(userId);
  const data: Record<string, unknown> = {
    _initialized: true,
    items: categories.length > 0 ? categories : null,
  };
  await set(categoriesRef, data);
};

export const loadActivityCategories = async (
  userId: string,
): Promise<ActivityCategory[] | null> => {
  const categoriesRef = getActivityCategoriesRef(userId);
  const snapshot = await get(categoriesRef);

  if (snapshot.exists()) {
    const val = snapshot.val();
    const items = val?.items;

    if (!items) {
      return [];
    }

    return Array.isArray(items) ? items : Object.values(items);
  }

  return null;
};

export const subscribeToActivityCategories = (
  userId: string,
  callback: (data: ActivityCategory[]) => void,
  defaultCategories: ActivityCategory[],
): (() => void) => {
  const categoriesRef = getActivityCategoriesRef(userId);
  let seeding = false;
  const unsubscribe = onValue(categoriesRef, (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      const items = val?.items;

      if (!items) {
        callback([]);
      } else {
        callback(Array.isArray(items) ? items : Object.values(items));
      }
    } else if (!seeding) {
      seeding = true;
      const data: Record<string, unknown> = {
        _initialized: true,
        items: defaultCategories.length > 0 ? defaultCategories : null,
      };
      set(categoriesRef, data).then(() => {
        seeding = false;
      });
    }
  });

  return unsubscribe;
};

// User Directory (populated on login, admin-readable)
// Fields are optional because PII is removed on account deletion while analytics are retained
export interface UserDirectoryEntry {
  email?: string;
  displayName?: string;
  lastLogin?: string;
}

export const updateUserDirectory = async (
  userId: string,
  email: string,
  displayName: string,
): Promise<void> => {
  const entryRef = ref(database, `userDirectory/${userId}`);
  await update(entryRef, {
    email,
    displayName,
    lastLogin: new Date().toISOString(),
  });
};

// Admin functions
export const subscribeToUserDirectory = (
  callback: (data: Record<string, UserDirectoryEntry> | null) => void,
): (() => void) => {
  const directoryRef = ref(database, 'userDirectory');
  const unsubscribe = onValue(directoryRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as Record<string, UserDirectoryEntry>);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

export const getUserLimitsForAdmin = async (
  userId: string,
): Promise<DailyMessageLimit | null> => {
  const limitsRef = getUserLimitsRef(userId);
  const snapshot = await get(limitsRef);

  if (snapshot.exists()) {
    return snapshot.val() as DailyMessageLimit;
  }

  return null;
};

export const setUserLimitsForAdmin = async (
  userId: string,
  limits: Pick<DailyMessageLimit, 'count' | 'max'>,
): Promise<void> => {
  const limitsRef = getUserLimitsRef(userId);
  await set(limitsRef, { ...limits, lastUpdated: Date.now() });
};

// Analytics functions
export const getAllTimeUserUsage = async (userId: string): Promise<number> => {
  try {
    // Read from real-time message sends log (independent of user login)
    const sendsSnapshot = await get(
      ref(database, `userDirectory/${userId}/messageSends`),
    );

    if (!sendsSnapshot.exists()) {
      return 0;
    }

    let total = 0;
    const data = sendsSnapshot.val();

    // Iterate through all year-months
    Object.values(data).forEach((monthData) => {
      // Iterate through all days in each month
      Object.values(monthData as Record<string, number>).forEach((count) => {
        total += count;
      });
    });

    return total;
  } catch (error) {
    console.error('Failed to get all-time usage:', error);

    return 0;
  }
};

export const getUserUsageStats = async (
  userId: string,
): Promise<{
  last30Days: MessageUsageHistory[];
  totalMessages: number;
  averageDaily: number;
  allTimeTotal: number;
} | null> => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get current and previous month from messageSends (real-time logs)
  const currentMonth = today.toISOString().substring(0, 7);
  const previousMonth = thirtyDaysAgo.toISOString().substring(0, 7);

  const [allTimeTotal, currentSends, previousSends, currentLimits] =
    await Promise.all([
      getAllTimeUserUsage(userId),
      get(
        ref(database, `userDirectory/${userId}/messageSends/${currentMonth}`),
      ),
      currentMonth !== previousMonth
        ? get(
            ref(
              database,
              `userDirectory/${userId}/messageSends/${previousMonth}`,
            ),
          )
        : Promise.resolve(null),
      getUserLimitsForAdmin(userId),
    ]);

  // Convert messageSends to MessageUsageHistory format
  const allData: Record<string, MessageUsageHistory> = {};

  if (currentSends?.exists()) {
    const monthData = currentSends.val() as Record<string, number>;
    Object.entries(monthData).forEach(([day, count]) => {
      const date = `${currentMonth}-${day}`;
      allData[date] = {
        date,
        count,
        max: currentLimits?.max ?? DAILY_MESSAGE_LIMIT,
      };
    });
  }

  if (previousSends?.exists()) {
    const monthData = previousSends.val() as Record<string, number>;
    Object.entries(monthData).forEach(([day, count]) => {
      const date = `${previousMonth}-${day}`;
      allData[date] = {
        date,
        count,
        max: currentLimits?.max ?? DAILY_MESSAGE_LIMIT,
      };
    });
  }

  if (Object.keys(allData).length === 0 && allTimeTotal === 0) {
    return null;
  }

  // Filter to last 30 days
  const last30Days = Object.values(allData)
    .filter((entry) => {
      const entryDate = new Date(entry.date);

      return entryDate >= thirtyDaysAgo && entryDate <= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalMessages = last30Days.reduce((sum, entry) => sum + entry.count, 0);
  const averageDaily =
    last30Days.length > 0 ? totalMessages / last30Days.length : 0;

  return {
    last30Days,
    totalMessages,
    averageDaily,
    allTimeTotal,
  };
};
