import type { IRowData } from './types';

import { get, ref, set } from 'firebase/database';

import { database } from './db';

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
