import type { ITrainingSession } from '@app-types/types';
import type {
  IActivityCategory,
  ICalendarEntries,
  ICalendarEntry,
  ICalendarNotes,
  ITrainerCalendarData,
} from '@firebase-config/database';
import type { User } from 'firebase/auth';

import {
  cancelSession,
  createCalendarEntry,
  createTrainingSession,
  deleteCalendarEntry,
  saveActivityCategories,
  saveCalendarNote,
  toggleTrainerCalendarDay,
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
  trainerCalendar: ITrainerCalendarData | null;
  categories: IActivityCategory[];
  trainingSessions: ITrainingSession[];
  trainerCategoryForDisplay: IActivityCategory | null;
}

export const useCalendarHandlers = ({
  user,
  targetUserId,
  connectionId,
  calendarEntries,
  trainerCalendar,
  categories,
  trainingSessions,
  trainerCategoryForDisplay,
}: UseCalendarHandlersParams) => {
  const { t } = useTranslation();
  const trainerToggleInFlight = useRef(new Set<string>());
  const noteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const entryNoteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const handleTrainerToggle = useCallback(
    async (
      dateKey: string,
      time: string | null,
      timeEnd: string | null,
      note: string,
    ) => {
      if (
        !targetUserId ||
        !trainerCategoryForDisplay?.trainerId ||
        !connectionId ||
        !user
      ) {
        return;
      }

      const isTrainerMarked = trainerCalendar?.[dateKey] === true;
      const dayEntries = calendarEntries?.[dateKey]
        ? Object.values(calendarEntries[dateKey])
        : [];
      const inRegular = dayEntries.some(
        (e) =>
          e.type === 'activity' &&
          e.activityId === trainerCategoryForDisplay.id,
      );
      const hasSession = trainingSessions.some(
        (s) => s.date === dateKey && s.status !== 'cancelled',
      );
      if (isTrainerMarked || inRegular || hasSession) {
        return;
      }

      if (trainerToggleInFlight.current.has(dateKey)) {
        return;
      }
      trainerToggleInFlight.current.add(dateKey);

      try {
        await toggleTrainerCalendarDay(targetUserId, dateKey, true);
        const sessionId = await createTrainingSession(
          connectionId,
          trainerCategoryForDisplay.trainerId!,
          targetUserId,
          dateKey,
          time,
          timeEnd,
        );
        if (note) {
          await updateSessionNote(connectionId, sessionId, note);
        }
      } catch {
        try {
          await toggleTrainerCalendarDay(targetUserId, dateKey, false);
        } catch {
          // Ignore rollback failure
        }
        toast.error(t('common.saveError'));
      } finally {
        trainerToggleInFlight.current.delete(dateKey);
      }
    },
    [
      targetUserId,
      calendarEntries,
      trainerCalendar,
      trainerCategoryForDisplay,
      trainingSessions,
      connectionId,
      user,
      t,
    ],
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
        if (entryId.startsWith('trainer-')) {
          if (targetUserId) {
            await toggleTrainerCalendarDay(targetUserId, date, false);
          }
          if (connectionId) {
            const session = trainingSessions.find(
              (s) => s.date === date && s.status !== 'cancelled',
            );
            if (session) {
              await cancelSession(connectionId, session.id, 'trainer');
            }
          }
        } else if (entryId.startsWith('session-')) {
          const sessionId = entryId.replace('session-', '');
          if (connectionId) {
            await cancelSession(connectionId, sessionId, 'trainer');
          }
          if (targetUserId) {
            const remaining = trainingSessions.filter(
              (s) =>
                s.date === date &&
                s.status !== 'cancelled' &&
                s.id !== sessionId,
            );
            if (remaining.length === 0) {
              await toggleTrainerCalendarDay(targetUserId, date, false);
            }
          }
        } else {
          await deleteCalendarEntry(user.uid, date, entryId);
        }
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, targetUserId, connectionId, trainingSessions, t],
  );

  const handleUpdateEntryNote = useCallback(
    (entryId: string, date: string, value: string) => {
      if (!user) {
        return;
      }

      if (entryId.startsWith('trainer-') || entryId.startsWith('session-')) {
        if (!connectionId) {
          return;
        }
        const sessionId = entryId.startsWith('session-')
          ? entryId.replace('session-', '')
          : trainingSessions.find(
              (s) => s.date === date && s.status !== 'cancelled',
            )?.id;
        if (!sessionId) {
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
              await updateSessionNote(connectionId, sessionId, value);
            } catch {
              toast.error(t('common.saveError'));
            } finally {
              entryNoteTimersRef.current.delete(entryId);
            }
          }, 500),
        );

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
    [user, connectionId, trainingSessions, t],
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

      if (entryId.startsWith('trainer-') || entryId.startsWith('session-')) {
        if (!connectionId) {
          return;
        }
        const sessionId = entryId.startsWith('session-')
          ? entryId.replace('session-', '')
          : trainingSessions.find(
              (s) => s.date === date && s.status !== 'cancelled',
            )?.id;
        if (!sessionId) {
          return;
        }
        try {
          await updateSessionTime(connectionId, sessionId, time, timeEnd);
        } catch {
          toast.error(t('common.saveError'));
        }

        return;
      }

      try {
        await updateCalendarEntryTime(user.uid, date, entryId, time, timeEnd);
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, connectionId, trainingSessions, t],
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
  }, []);

  return {
    clearTimers,
    handleTrainerToggle,
    handleAddEntry,
    handleDeleteEntry,
    handleUpdateEntryNote,
    handleUpdateEntryTime,
    handleSaveNewCategory,
    handleNoteChange,
  };
};
