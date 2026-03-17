import type { ISharingPreferences } from './types';
import type {
  IUserPreferences,
  IUserSettings,
} from '@contexts/SettingsContext';

import { get, onValue, ref, set } from 'firebase/database';

import { database } from './db';

export const getUserSettingsRef = (userId: string) =>
  ref(database, `users/${userId}/settings`);

export const saveUserSettings = async (
  userId: string,
  settings: IUserSettings,
): Promise<void> => {
  const settingsRef = getUserSettingsRef(userId);
  await set(settingsRef, settings);
};

export const loadUserSettings = async (
  userId: string,
): Promise<IUserSettings | null> => {
  const settingsRef = getUserSettingsRef(userId);
  const snapshot = await get(settingsRef);

  if (snapshot.exists()) {
    return snapshot.val() as IUserSettings;
  }

  return null;
};

export const getUserPreferencesRef = (userId: string) =>
  ref(database, `users/${userId}/preferences`);

export const saveUserPreferences = async (
  userId: string,
  preferences: IUserPreferences,
): Promise<void> => {
  const preferencesRef = getUserPreferencesRef(userId);
  await set(preferencesRef, preferences);
};

export const loadUserPreferences = async (
  userId: string,
): Promise<IUserPreferences | null> => {
  const preferencesRef = getUserPreferencesRef(userId);
  const snapshot = await get(preferencesRef);

  if (snapshot.exists()) {
    return snapshot.val() as IUserPreferences;
  }

  return null;
};

// Sharing Preferences
export const getUserSharingPreferencesRef = (userId: string) =>
  ref(database, `users/${userId}/sharingPreferences`);

export const saveSharingPreferences = async (
  userId: string,
  sharingPreferences: ISharingPreferences,
): Promise<void> => {
  const sharingRef = getUserSharingPreferencesRef(userId);
  await set(sharingRef, sharingPreferences);
};

export const loadSharingPreferences = async (
  userId: string,
): Promise<ISharingPreferences | null> => {
  const sharingRef = getUserSharingPreferencesRef(userId);
  const snapshot = await get(sharingRef);

  if (snapshot.exists()) {
    return snapshot.val() as ISharingPreferences;
  }

  return null;
};

export const subscribeToSharingPreferences = (
  userId: string,
  callback: (data: ISharingPreferences | null) => void,
): (() => void) => {
  const sharingRef = getUserSharingPreferencesRef(userId);

  return onValue(sharingRef, (snapshot) => {
    callback(
      snapshot.exists() ? (snapshot.val() as ISharingPreferences) : null,
    );
  });
};
