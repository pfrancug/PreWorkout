import type { ITrainingSession } from '@app-types/types';
import type {
  IActivityCategory,
  ICalendarEntries,
  ICalendarEntry,
  ICalendarNotes,
} from '@firebase-config/database';
import type { User } from 'firebase/auth';

import {
  cancelSession,
  createCalendarEntry,
  createTrainingSession,
  deleteCalendarEntry,
  saveActivityCategories,
  saveCalendarNote,
  updateCalendarEntryNote,
  updateCalendarEntryTime,
  updateSessionNote,
  updateSessionTime,
} from '@firebase-config/database';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface UseCalendarHandlersParams {
  user: User | null;
  targetUserId: string | undefined;
  connectionId: string | undefined;
  calendarEntries: ICalendarEntries | null;
  calendarNotes: ICalendarNotes | null;
  categories: IActivityCategory[];
  trainingSessions: ITrainingSession[];
}

export const useCalendarHandlers = ({
  user,
  targetUserId,
  connectionId,
  categories,
  trainingSessions,
}: UseCalendarHandlersParams) => {
  const { t } = useTranslation();
  const noteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const entryNoteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const sessionNoteTimersRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());

  const handleAddTrainingSession = useCallback(
    async (
      dateKey: string,
      time: string | null,
      timeEnd: string | null,
      note: string,
    ) => {
      if (!targetUserId || !connectionId || !user) {
        return;
      }

      try {
        // Determine trainerId from existing sessions or user context
        const existingSession = trainingSessions[0];
        const trainerId = existingSession?.trainerId ?? user.uid;
        const traineeId = existingSession?.traineeId ?? targetUserId;

        const sessionId = await createTrainingSession(
          connectionId,
          trainerId,
          traineeId,
          dateKey,
          time,
          timeEnd,
        );
        if (note) {
          await updateSessionNote(connectionId, sessionId, note);
        }
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [targetUserId, connectionId, user, trainingSessions, t],
  );

  const handleAddEntry = useCallback(
    async (entryData: Omit<ICalendarEntry, 'id'>, date: string) => {
      if (!user) {
        return;
      }
      try {
        await createCalendarEntry(user.uid, date, entryData);
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, t],
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string, date: string) => {
      if (!user) {
        return;
      }
      try {
        await deleteCalendarEntry(user.uid, date, entryId);
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, t],
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (!connectionId) {
        return;
      }
      try {
        await cancelSession(connectionId, sessionId, 'trainer');
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [connectionId, t],
  );

  const handleUpdateEntryNote = useCallback(
    (entryId: string, date: string, value: string) => {
      if (!user) {
        return;
      }

      const existing = entryNoteTimersRef.current.get(entryId);
      if (existing) {
        clearTimeout(existing);
      }
      entryNoteTimersRef.current.set(
        entryId,
        setTimeout(async () => {
          try {
            await updateCalendarEntryNote(user.uid, date, entryId, value);
          } catch {
            toast.error(t('common.saveError'));
          } finally {
            entryNoteTimersRef.current.delete(entryId);
          }
        }, 500),
      );
    },
    [user, t],
  );

  const handleUpdateSessionNote = useCallback(
    (sessionId: string, _date: string, value: string) => {
      if (!connectionId) {
        return;
      }

      const existing = sessionNoteTimersRef.current.get(sessionId);
      if (existing) {
        clearTimeout(existing);
      }
      sessionNoteTimersRef.current.set(
        sessionId,
        setTimeout(async () => {
          try {
            await updateSessionNote(connectionId, sessionId, value);
          } catch {
            toast.error(t('common.saveError'));
          } finally {
            sessionNoteTimersRef.current.delete(sessionId);
          }
        }, 500),
      );
    },
    [connectionId, t],
  );

  const handleUpdateEntryTime = useCallback(
    async (
      entryId: string,
      date: string,
      time: string | null,
      timeEnd?: string | null,
    ) => {
      if (!user) {
        return;
      }

      try {
        await updateCalendarEntryTime(user.uid, date, entryId, time, timeEnd);
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, t],
  );

  const handleUpdateSessionTime = useCallback(
    async (
      sessionId: string,
      _date: string,
      time: string | null,
      timeEnd?: string | null,
    ) => {
      if (!connectionId) {
        return;
      }

      try {
        await updateSessionTime(connectionId, sessionId, time, timeEnd);
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [connectionId, t],
  );

  const handleSaveNewCategory = useCallback(
    async (newCategory: IActivityCategory) => {
      if (!user) {
        return;
      }
      try {
        await saveActivityCategories(user.uid, [...categories, newCategory]);
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, categories, t],
  );

  const handleNoteChange = useCallback(
    (value: string, date: string) => {
      if (!user) {
        return;
      }
      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
      }
      noteTimerRef.current = setTimeout(async () => {
        try {
          await saveCalendarNote(user.uid, date, value);
        } catch {
          toast.error(t('common.saveError'));
        }
      }, 500);
    },
    [user, t],
  );

  const clearTimers = useCallback(() => {
    if (noteTimerRef.current) {
      clearTimeout(noteTimerRef.current);
    }
    entryNoteTimersRef.current.forEach(clearTimeout);
    entryNoteTimersRef.current.clear();
    sessionNoteTimersRef.current.forEach(clearTimeout);
    sessionNoteTimersRef.current.clear();
  }, []);

  return {
    clearTimers,
    handleAddTrainingSession,
    handleAddEntry,
    handleDeleteEntry,
    handleDeleteSession,
    handleUpdateEntryNote,
    handleUpdateEntryTime,
    handleUpdateSessionNote,
    handleUpdateSessionTime,
    handleSaveNewCategory,
    handleNoteChange,
  };
};
