import type { UserSettings } from '../contexts/SettingsContext';
import type { Message } from '@components/Chat';

import { get, getDatabase, ref, set } from 'firebase/database';
import { onValue, push } from 'firebase/database';

import { app } from './config';

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

export const getUserMessagesRef = (userId: string) =>
  ref(database, `users/${userId}/messages`);

export const saveUserMessage = async (
  userId: string,
  message: Message,
): Promise<void> => {
  const messagesRef = getUserMessagesRef(userId);
  await push(messagesRef, message);
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
