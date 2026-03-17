import type { IUserDirectoryEntry } from './types';

import { get, ref, set, update } from 'firebase/database';
import { onValue } from 'firebase/database';

import { database } from './db';

export const updateUserDirectory = async (
  userId: string,
  email: string,
  googleDisplayName: string,
): Promise<void> => {
  const entryRef = ref(database, `userDirectory/${userId}`);

  // Only set displayName on first login; afterwards it's managed via settings
  const existingName = await get(
    ref(database, `userDirectory/${userId}/displayName`),
  );
  const updates: Record<string, string> = {
    email,
    lastLogin: new Date().toISOString(),
  };
  if (!existingName.exists() || !existingName.val()) {
    updates.displayName = googleDisplayName;
  }
  await update(entryRef, updates);
};

/** Update only the display name in userDirectory (for settings sync). */
export const updateUserDisplayName = async (
  userId: string,
  displayName: string,
): Promise<void> => {
  await update(ref(database, `userDirectory/${userId}`), { displayName });
};

// Admin functions
export const subscribeToUserDirectory = (
  callback: (data: Record<string, IUserDirectoryEntry> | null) => void,
): (() => void) => {
  const directoryRef = ref(database, 'userDirectory');
  const unsubscribe = onValue(directoryRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as Record<string, IUserDirectoryEntry>);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

export const getUserDirectoryEntry = async (
  userId: string,
): Promise<IUserDirectoryEntry | null> => {
  const snapshot = await get(ref(database, `userDirectory/${userId}`));

  return snapshot.exists() ? (snapshot.val() as IUserDirectoryEntry) : null;
};

export const getUserDisplayName = async (
  userId: string,
): Promise<string | null> => {
  const snapshot = await get(
    ref(database, `userDirectory/${userId}/displayName`),
  );

  return snapshot.exists() ? (snapshot.val() as string) : null;
};

export const getUserAvatarUrl = async (
  userId: string,
): Promise<string | null> => {
  const snapshot = await get(
    ref(database, `users/${userId}/settings/avatarUrl`),
  );

  return snapshot.exists() ? (snapshot.val() as string) : null;
};

export const setTrainerFlagInDirectory = async (
  userId: string,
  isTrainer: boolean,
): Promise<void> => {
  await set(ref(database, `userDirectory/${userId}/isTrainer`), isTrainer);
};

export const getTrainerFlagFromDirectory = async (
  userId: string,
): Promise<boolean> => {
  const snapshot = await get(
    ref(database, `userDirectory/${userId}/isTrainer`),
  );

  return snapshot.exists() ? (snapshot.val() as boolean) : false;
};
