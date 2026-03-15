import type { IActivityCategory } from './types';

import { get, ref, set } from 'firebase/database';
import { onValue } from 'firebase/database';

import { database } from './db';

export const getActivityCategoriesRef = (userId: string) =>
  ref(database, `users/${userId}/activityCategories`);

export const saveActivityCategories = async (
  userId: string,
  categories: IActivityCategory[],
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
): Promise<IActivityCategory[] | null> => {
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
  callback: (data: IActivityCategory[]) => void,
  defaultCategories: IActivityCategory[],
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
