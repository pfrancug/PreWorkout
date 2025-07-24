import type { User } from 'firebase/auth';

import { getDatabase, push, ref, serverTimestamp } from 'firebase/database';

import { app } from './config';

const database = getDatabase(app);

export const handleSetData = async (currentUser: User | null) => {
  if (!currentUser) {
    return;
  }

  const messagesRef = ref(database, 'messages');

  try {
    await push(messagesRef, {
      text: 'test',
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
      isBot: false,
    });
    console.log('User message sent successfully!');
  } catch (error) {
    console.error('Error sending user message:', error);
  }
};
