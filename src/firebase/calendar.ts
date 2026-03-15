import type {
  ICalendarEntries,
  ICalendarEntry,
  ICalendarNotes,
  ITrainerCalendarData,
} from './types';

import { get, push, ref, remove, set, update } from 'firebase/database';
import { onValue } from 'firebase/database';

import { database } from './db';

// Calendar Notes
export const getUserCalendarNotesRef = (userId: string) =>
  ref(database, `users/${userId}/calendarNotes`);

export const loadCalendarNotes = async (
  userId: string,
): Promise<ICalendarNotes | null> => {
  const notesRef = getUserCalendarNotesRef(userId);
  const snapshot = await get(notesRef);

  if (snapshot.exists()) {
    return snapshot.val() as ICalendarNotes;
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
  callback: (data: ICalendarNotes | null) => void,
): (() => void) => {
  const notesRef = getUserCalendarNotesRef(userId);
  const unsubscribe = onValue(notesRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as ICalendarNotes);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

// Calendar Entries
export const getUserCalendarEntriesRef = (userId: string) =>
  ref(database, `users/${userId}/calendarEntries`);

export const createCalendarEntry = async (
  userId: string,
  date: string,
  entryData: Omit<ICalendarEntry, 'id'>,
): Promise<ICalendarEntry> => {
  const dateRef = ref(database, `users/${userId}/calendarEntries/${date}`);
  const newRef = push(dateRef);
  const id = newRef.key!;
  const entry: ICalendarEntry = { ...entryData, id };
  await set(newRef, entry);

  return entry;
};

export const deleteCalendarEntry = async (
  userId: string,
  date: string,
  entryId: string,
): Promise<void> => {
  await remove(
    ref(database, `users/${userId}/calendarEntries/${date}/${entryId}`),
  );
};

export const updateCalendarEntryNote = async (
  userId: string,
  date: string,
  entryId: string,
  note: string,
): Promise<void> => {
  const noteRef = ref(
    database,
    `users/${userId}/calendarEntries/${date}/${entryId}/note`,
  );
  if (!note.trim()) {
    await remove(noteRef);
  } else {
    await set(noteRef, note.trim());
  }
};

export const updateCalendarEntryTime = async (
  userId: string,
  date: string,
  entryId: string,
  time: string | null,
  timeEnd?: string | null,
): Promise<void> => {
  const entryRef = ref(
    database,
    `users/${userId}/calendarEntries/${date}/${entryId}`,
  );
  const updates: Record<string, unknown> = { time };
  if (timeEnd !== undefined) {
    updates.timeEnd = timeEnd;
  }
  await update(entryRef, updates);
};

export const subscribeToCalendarEntries = (
  userId: string,
  callback: (data: ICalendarEntries | null) => void,
): (() => void) => {
  const entriesRef = getUserCalendarEntriesRef(userId);

  return onValue(entriesRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as ICalendarEntries) : null);
  });
};

export const loadCalendarEntries = async (
  userId: string,
): Promise<ICalendarEntries | null> => {
  const snapshot = await get(getUserCalendarEntriesRef(userId));

  return snapshot.exists() ? (snapshot.val() as ICalendarEntries) : null;
};

// Trainer Calendar
export const subscribeToTrainerCalendar = (
  userId: string,
  callback: (data: ITrainerCalendarData | null) => void,
): (() => void) => {
  const trainerCalRef = ref(database, `users/${userId}/trainerCalendar`);
  const unsubscribe = onValue(trainerCalRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as ITrainerCalendarData);
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
