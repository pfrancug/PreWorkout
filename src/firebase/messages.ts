import type { Message } from '@components/types';

import { get, ref, remove, set } from 'firebase/database';
import { onValue } from 'firebase/database';

import { database } from './db';

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
