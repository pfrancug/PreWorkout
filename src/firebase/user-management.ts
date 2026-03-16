import type { IAllUserData, ICalendarEntries } from './types';
import type { ITrainerConnection } from '@app-types/types';

import {
  equalTo,
  get,
  orderByChild,
  query,
  ref,
  remove,
  set,
  update,
} from 'firebase/database';

import {
  getActivityCategoriesRef,
  loadActivityCategories,
  saveActivityCategories,
} from './activity-categories';
import {
  getUserCalendarEntriesRef,
  getUserCalendarNotesRef,
  loadCalendarNotes,
} from './calendar';
import { database } from './db';
import { getUserDataRef, loadUserData, saveUserData } from './diary';
import { getUserLimitsRef, loadMessageLimitConfig } from './message-limits';
import {
  getUserMessagesRef,
  loadUserMessages,
  saveUserMessages,
} from './messages';
import {
  getUserPreferencesRef,
  getUserSettingsRef,
  loadUserPreferences,
  loadUserSettings,
  saveUserPreferences,
  saveUserSettings,
} from './settings';

/**
 * Deletes all user data from the database.
 *
 * GDPR Compliance Note (Option A — Anonymize shared data):
 * - Deletes all personal data (settings, diary, calendar, preferences, etc.)
 * - Removes PII fields from userDirectory (email, displayName, lastLogin, isTrainer)
 * - Retains userDirectory/{uid}/messageSends for anonymized analytics (GDPR Article 89)
 * - Marks trainer connections as 'deleted' so the other side keeps session history
 * - Training sessions are preserved (dates + payment data, no PII) under anonymized UIDs
 * - Cleans up trainerId pointers on connected trainees/trainers
 * - Once Firebase Auth account is deleted, userId becomes a pseudonymous
 *   identifier that cannot be linked back to the individual
 */
export const deleteAllUserData = async (userId: string): Promise<void> => {
  // 1. Delete all personal user data
  await Promise.all([
    remove(getUserSettingsRef(userId)),
    remove(getUserPreferencesRef(userId)),
    remove(getUserMessagesRef(userId)),
    remove(getUserDataRef(userId)),
    remove(getUserLimitsRef(userId)),
    remove(getUserCalendarEntriesRef(userId)),
    remove(getUserCalendarNotesRef(userId)),
    remove(getActivityCategoriesRef(userId)),
    remove(ref(database, `users/${userId}/trainerCalendar`)),
    remove(ref(database, `users/${userId}/trainerId`)),
    remove(ref(database, `users/${userId}/trainerConnectionId`)),
    // Remove PII fields from userDirectory, keep analytics (messageSends)
    remove(ref(database, `userDirectory/${userId}/email`)),
    remove(ref(database, `userDirectory/${userId}/displayName`)),
    remove(ref(database, `userDirectory/${userId}/lastLogin`)),
    remove(ref(database, `userDirectory/${userId}/isTrainer`)),
  ]);

  // 2. Handle trainer connections — mark as 'deleted', clean up other side
  await cleanupConnectionsForDeletedUser(userId);
};

/**
 * Finds all trainer connections involving this user (as trainer or trainee)
 * and marks them as 'deleted'. Also cleans up trainerId on affected trainees.
 */
const cleanupConnectionsForDeletedUser = async (
  userId: string,
): Promise<void> => {
  const connectionsRef = ref(database, 'trainerConnections');

  // Find connections where user is the trainer
  const asTrainerSnap = await get(
    query(connectionsRef, orderByChild('trainerId'), equalTo(userId)),
  );
  // Find connections where user is the trainee
  const asTraineeSnap = await get(
    query(connectionsRef, orderByChild('traineeId'), equalTo(userId)),
  );

  const updates: Record<string, unknown> = {};

  if (asTrainerSnap.exists()) {
    const data = asTrainerSnap.val() as Record<string, ITrainerConnection>;
    for (const [connId, conn] of Object.entries(data)) {
      updates[`trainerConnections/${connId}/status`] = 'deleted';
      // Remove trainerId + trainerConnectionId pointers from the trainee
      if (conn.traineeId) {
        updates[`users/${conn.traineeId}/trainerId`] = null;
        updates[`users/${conn.traineeId}/trainerConnectionId`] = null;
      }
    }
  }

  if (asTraineeSnap.exists()) {
    const data = asTraineeSnap.val() as Record<string, ITrainerConnection>;
    for (const [connId] of Object.entries(data)) {
      // Soft-delete so the trainer keeps session history
      updates[`trainerConnections/${connId}/status`] = 'deleted';
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(database), updates);
  }

  // Clean up any pending invites created by this user
  const invitesRef = ref(database, 'trainerInvites');
  const invitesSnap = await get(
    query(invitesRef, orderByChild('trainerId'), equalTo(userId)),
  );
  if (invitesSnap.exists()) {
    const inviteRemovals: Promise<void>[] = [];
    invitesSnap.forEach((childSnap) => {
      inviteRemovals.push(remove(childSnap.ref));
    });
    await Promise.all(inviteRemovals);
  }
};

export const importAllUserData = async (
  userId: string,
  data: IAllUserData,
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
    promises.push(set(getUserLimitsRef(userId), { mode: data.limits.mode }));
  }
  if (data.calendarEntries) {
    promises.push(set(getUserCalendarEntriesRef(userId), data.calendarEntries));
  }
  if (data.calendarNotes) {
    promises.push(set(getUserCalendarNotesRef(userId), data.calendarNotes));
  }
  if (data.activityCategories) {
    promises.push(saveActivityCategories(userId, data.activityCategories));
  }
  if (data.trainerCalendar) {
    promises.push(
      set(
        ref(database, `users/${userId}/trainerCalendar`),
        data.trainerCalendar,
      ),
    );
  }

  await Promise.all(promises);
};

// NOTE: loadAllUserData only reads calendarEntries.
export const loadAllUserData = async (
  userId: string,
): Promise<IAllUserData> => {
  const [
    settings,
    preferences,
    messages,
    data,
    limits,
    calendarEntriesSnap,
    calendarNotes,
    activityCategories,
    trainerCalendarSnap,
  ] = await Promise.all([
    loadUserSettings(userId),
    loadUserPreferences(userId),
    loadUserMessages(userId),
    loadUserData(userId),
    loadMessageLimitConfig(userId),
    get(getUserCalendarEntriesRef(userId)),
    loadCalendarNotes(userId),
    loadActivityCategories(userId),
    get(ref(database, `users/${userId}/trainerCalendar`)),
  ]);

  return {
    settings,
    preferences,
    messages,
    data,
    limits,
    calendarEntries: calendarEntriesSnap.exists()
      ? (calendarEntriesSnap.val() as ICalendarEntries)
      : null,
    calendarNotes,
    activityCategories,
    trainerCalendar: trainerCalendarSnap.exists()
      ? trainerCalendarSnap.val()
      : null,
  };
};
