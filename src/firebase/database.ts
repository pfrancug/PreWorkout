import type {
  UserPreferences,
  UserSettings,
} from '../contexts/SettingsContext';
import type { ITrainerConnection } from '../types/types';
import type { Message } from '@components/Chat';

import {
  equalTo,
  get,
  getDatabase,
  orderByChild,
  push,
  query,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from 'firebase/database';
import { onValue } from 'firebase/database';

import { app } from './config';

export interface MessageLimitConfig {
  max: number;
}

export type CalendarActivity = string;

export interface ActivityCategory {
  id: string;
  icon: string;
  name: string;
  color: string;
  /** Trainer user ID – present on auto-created trainer activity categories */
  trainerId?: string;
  /** True for categories auto-created by the system (e.g. on trainer connect) */
  systemGenerated?: boolean;
  /** True when the trainer disconnects – keeps historical data intact */
  orphaned?: boolean;
}

export interface TrainerCalendarData {
  [date: string]: boolean;
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
  limits: MessageLimitConfig | null;
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
    promises.push(set(getUserLimitsRef(userId), { max: data.limits.max }));
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
    loadMessageLimitConfig(userId),
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

const loadMessageLimitConfig = async (
  userId: string,
): Promise<MessageLimitConfig | null> => {
  const limitsRef = getUserLimitsRef(userId);
  const snapshot = await get(limitsRef);

  if (snapshot.exists()) {
    const val = snapshot.val();

    return { max: val.max ?? DAILY_MESSAGE_LIMIT };
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

// Trainer Calendar (trainer-marked activity days)
export const subscribeToTrainerCalendar = (
  userId: string,
  callback: (data: TrainerCalendarData | null) => void,
): (() => void) => {
  const trainerCalRef = ref(database, `users/${userId}/trainerCalendar`);
  const unsubscribe = onValue(trainerCalRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as TrainerCalendarData);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

export const toggleTrainerCalendarDay = async (
  userId: string,
  date: string,
  active: boolean,
): Promise<void> => {
  const dayRef = ref(database, `users/${userId}/trainerCalendar/${date}`);

  if (active) {
    await set(dayRef, true);
  } else {
    await remove(dayRef);
  }
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

export const getUserMaxLimitForAdmin = async (
  userId: string,
): Promise<number> => {
  const snapshot = await get(getUserLimitsRef(userId));

  return snapshot.exists()
    ? (snapshot.val().max ?? DAILY_MESSAGE_LIMIT)
    : DAILY_MESSAGE_LIMIT;
};

export const setUserMaxLimitForAdmin = async (
  userId: string,
  max: number,
): Promise<void> => {
  await set(getUserLimitsRef(userId), { max });
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

// Energy Drinks Tracking
export interface EnergyDrinksData {
  [date: string]: string[]; // date -> array of drink IDs
}

export const getEnergyDrinksRef = (userId: string) =>
  ref(database, `users/${userId}/energyDrinks`);

export const loadEnergyDrinks = async (
  userId: string,
): Promise<EnergyDrinksData | null> => {
  const drinksRef = getEnergyDrinksRef(userId);
  const snapshot = await get(drinksRef);

  if (snapshot.exists()) {
    return snapshot.val() as EnergyDrinksData;
  }

  return null;
};

export const addEnergyDrink = async (
  userId: string,
  drinkId: string,
  date?: string,
): Promise<void> => {
  const targetDate = date ?? getTodayDateString();
  const dayRef = ref(database, `users/${userId}/energyDrinks/${targetDate}`);

  await runTransaction(dayRef, (currentDrinks: string[] | null) => {
    if (!currentDrinks) {
      return [drinkId];
    }

    return [...currentDrinks, drinkId];
  });
};

export const removeEnergyDrink = async (
  userId: string,
  date: string,
  drinkIndex: number,
): Promise<void> => {
  const dayRef = ref(database, `users/${userId}/energyDrinks/${date}`);

  await runTransaction(dayRef, (currentDrinks: string[] | null) => {
    if (!currentDrinks || currentDrinks.length === 0) {
      return null;
    }
    const newDrinks = [...currentDrinks];
    newDrinks.splice(drinkIndex, 1);

    return newDrinks.length > 0 ? newDrinks : null;
  });
};

export const subscribeToEnergyDrinks = (
  userId: string,
  callback: (data: EnergyDrinksData | null) => void,
): (() => void) => {
  const drinksRef = getEnergyDrinksRef(userId);
  const unsubscribe = onValue(drinksRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as EnergyDrinksData);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

// ─── Trainer Feature ────────────────────────────────────────────────────────

/** Generate a short random invite code (6 chars, alphanumeric uppercase) */
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
};

/**
 * Trainer creates an invite code for a trainee to use.
 * Returns the invite code and connection ID.
 */
export const createTrainerInvite = async (
  trainerId: string,
  note?: string,
): Promise<{ inviteCode: string; connectionId: string }> => {
  const inviteCode = generateInviteCode();

  // Create the connection record
  const connectionsRef = ref(database, 'trainerConnections');
  const newConnectionRef = push(connectionsRef);
  const connectionId = newConnectionRef.key!;

  const connectionData: Record<string, unknown> = {
    trainerId,
    traineeId: '', // Will be filled when trainee accepts
    status: 'pending' as const,
    inviteCode,
    createdAt: Date.now(),
  };

  if (note) {
    connectionData.note = note;
  }

  await set(newConnectionRef, connectionData);

  // Create a lookup entry for the invite code
  await set(ref(database, `trainerInvites/${inviteCode}`), {
    trainerId,
    connectionId,
  });

  return { inviteCode, connectionId };
};

/**
 * Trainee accepts a trainer invite by entering the invite code.
 * Sets the connection to active and stores trainerId on the user.
 */
export const acceptTrainerInvite = async (
  traineeId: string,
  inviteCode: string,
): Promise<{ success: boolean; error?: string }> => {
  // Look up the invite
  const inviteSnapshot = await get(
    ref(database, `trainerInvites/${inviteCode.toUpperCase()}`),
  );

  if (!inviteSnapshot.exists()) {
    return { success: false, error: 'invalid_code' };
  }

  const { trainerId, connectionId } = inviteSnapshot.val() as {
    trainerId: string;
    connectionId: string;
  };

  // Check if trainee already has a trainer
  const existingTrainer = await get(
    ref(database, `users/${traineeId}/trainerId`),
  );
  if (existingTrainer.exists()) {
    return { success: false, error: 'already_has_trainer' };
  }

  // Verify the connection still exists and is pending
  const connectionSnapshot = await get(
    ref(database, `trainerConnections/${connectionId}`),
  );
  if (!connectionSnapshot.exists()) {
    return { success: false, error: 'connection_not_found' };
  }

  const connection = connectionSnapshot.val() as ITrainerConnection;
  if (connection.status !== 'pending') {
    return { success: false, error: 'invite_already_used' };
  }

  // Activate the connection
  await update(ref(database, `trainerConnections/${connectionId}`), {
    traineeId,
    status: 'active',
  });

  // Set trainerId on the user profile
  await set(ref(database, `users/${traineeId}/trainerId`), trainerId);

  // Remove the invite code (one-time use)
  await remove(ref(database, `trainerInvites/${inviteCode.toUpperCase()}`));

  // Auto-create trainer activity category for the trainee
  try {
    const trainerEntry = await getUserDirectoryEntry(trainerId);
    const trainerName = trainerEntry?.displayName || 'Trainer';
    const existingCategories = await loadActivityCategories(traineeId);
    const categories = existingCategories ?? [];

    // Only add if a trainer category doesn't already exist
    const alreadyExists = categories.some((c) => c.trainerId === trainerId);
    if (!alreadyExists) {
      const trainerCategory: ActivityCategory = {
        id: `trainer-${trainerId}`,
        icon: 'heart-pulse',
        name: `Training with ${trainerName}`,
        color: 'sky',
        trainerId,
        systemGenerated: true,
      };
      await saveActivityCategories(traineeId, [...categories, trainerCategory]);
    }
  } catch {
    // Non-critical – connection still succeeds even if category creation fails
  }

  return { success: true };
};

/**
 * Update the note on a pending invite / connection.
 */
export const updateConnectionNote = async (
  connectionId: string,
  note: string,
): Promise<void> => {
  await update(ref(database, `trainerConnections/${connectionId}`), { note });
};

/**
 * Delete a pending invite (removes connection + invite lookup).
 */
export const deletePendingInvite = async (
  connectionId: string,
): Promise<void> => {
  // Read invite code so we can clean up the lookup
  const snap = await get(ref(database, `trainerConnections/${connectionId}`));
  if (snap.exists()) {
    const { inviteCode } = snap.val() as { inviteCode: string };
    if (inviteCode) {
      await remove(ref(database, `trainerInvites/${inviteCode}`));
    }
  }
  await remove(ref(database, `trainerConnections/${connectionId}`));
};

/**
 * Either party can disconnect the trainer–trainee relationship.
 */
export const disconnectTrainer = async (
  connectionId: string,
  traineeId: string,
): Promise<void> => {
  // Read the connection to find the trainerId before removing
  const connSnap = await get(
    ref(database, `trainerConnections/${connectionId}`),
  );
  const trainerId = connSnap.exists()
    ? (connSnap.val() as ITrainerConnection).trainerId
    : null;

  // Remove the connection
  await remove(ref(database, `trainerConnections/${connectionId}`));

  // Remove trainerId from the user
  await remove(ref(database, `users/${traineeId}/trainerId`));

  // Mark trainer activity category as orphaned (keeps historical calendar data intact)
  if (trainerId) {
    try {
      const categories = await loadActivityCategories(traineeId);
      if (categories) {
        const updated = categories.map((c) =>
          c.trainerId === trainerId ? { ...c, orphaned: true } : c,
        );
        await saveActivityCategories(traineeId, updated);
      }
    } catch {
      // Non-critical – disconnect still succeeds
    }
  }
};

/**
 * Subscribe to all connections where the given user is the trainer.
 */
export const subscribeToTrainerConnections = (
  trainerId: string,
  callback: (connections: ITrainerConnection[]) => void,
): (() => void) => {
  const connectionsRef = ref(database, 'trainerConnections');
  const q = query(
    connectionsRef,
    orderByChild('trainerId'),
    equalTo(trainerId),
  );

  const unsubscribe = onValue(q, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, ITrainerConnection>;
      const connections = Object.entries(data).map(([key, val]) => ({
        ...val,
        id: key,
      }));
      callback(connections);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};

/**
 * Subscribe to the trainee's active trainer connection.
 */
export const subscribeToTraineeConnection = (
  traineeId: string,
  callback: (connection: ITrainerConnection | null) => void,
): (() => void) => {
  const connectionsRef = ref(database, 'trainerConnections');
  const q = query(
    connectionsRef,
    orderByChild('traineeId'),
    equalTo(traineeId),
  );

  const unsubscribe = onValue(q, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, ITrainerConnection>;
      const active = Object.entries(data).find(
        ([, val]) => val.status === 'active',
      );
      if (active) {
        callback({ ...active[1], id: active[0] });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

/**
 * Get user's trainerId (the trainer assigned to them).
 */
export const getTrainerId = async (userId: string): Promise<string | null> => {
  const snapshot = await get(ref(database, `users/${userId}/trainerId`));

  return snapshot.exists() ? (snapshot.val() as string) : null;
};

/**
 * Get a single user directory entry (for looking up trainee/trainer info).
 */
export const getUserDirectoryEntry = async (
  userId: string,
): Promise<UserDirectoryEntry | null> => {
  const snapshot = await get(ref(database, `userDirectory/${userId}`));

  return snapshot.exists() ? (snapshot.val() as UserDirectoryEntry) : null;
};

/**
 * Get a user's profile avatar URL from their settings.
 */
export const getUserAvatarUrl = async (
  userId: string,
): Promise<string | null> => {
  const snapshot = await get(
    ref(database, `users/${userId}/settings/avatarUrl`),
  );

  return snapshot.exists() ? (snapshot.val() as string) : null;
};

/**
 * Admin: set trainer custom claim via Cloud Function or server action.
 * This is a client-side helper that stores a flag in userDirectory
 * so the admin UI can display trainer status. The actual custom claim
 * must be set server-side (via set-trainer.ts script or admin API).
 */
export const setTrainerFlagInDirectory = async (
  userId: string,
  isTrainer: boolean,
): Promise<void> => {
  await update(ref(database, `userDirectory/${userId}`), {
    isTrainer,
  });
};

/**
 * Read trainer flag from user directory (for admin display).
 */
export const getTrainerFlagFromDirectory = async (
  userId: string,
): Promise<boolean> => {
  const snapshot = await get(
    ref(database, `userDirectory/${userId}/isTrainer`),
  );

  return snapshot.exists() ? (snapshot.val() as boolean) : false;
};
