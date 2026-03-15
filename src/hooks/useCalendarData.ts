import type {
  ActivityCategory,
  CalendarEntries,
  CalendarEntry,
  CalendarNotes,
  TrainerCalendarData,
} from '../firebase/database';
import type { ITrainingSession } from '../types/types';
import type { UseCalendarDataOptions } from './types';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { DEFAULT_CATEGORIES } from '../constants/activities';
import { useAuth } from '../contexts/useAuth';
import {
  cancelSession,
  createCalendarEntry,
  createTrainingSession,
  deleteCalendarEntry,
  saveActivityCategories,
  saveCalendarNote,
  subscribeToActivityCategories,
  subscribeToCalendarEntries,
  subscribeToCalendarNotes,
  subscribeToTraineeConnection,
  subscribeToTrainerCalendar,
  subscribeToTrainingSessions,
  toggleTrainerCalendarDay,
  updateCalendarEntryNote,
  updateCalendarEntryTime,
  updateSessionNote,
  updateSessionTime,
} from '../firebase/database';

export const useCalendarData = ({
  userId: propUserId,
  connectionId: connectionIdProp,
}: UseCalendarDataOptions) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [calendarEntries, setCalendarEntries] =
    useState<CalendarEntries | null>(null);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNotes | null>(
    null,
  );
  const [trainerCalendar, setTrainerCalendar] =
    useState<TrainerCalendarData | null>(null);
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<ITrainingSession[]>(
    [],
  );
  const [autoConnectionId, setAutoConnectionId] = useState<string | null>(null);

  const targetUserId = propUserId || user?.uid;
  const isOwnCalendar = !propUserId || propUserId === user?.uid;
  const connectionId = connectionIdProp ?? autoConnectionId ?? undefined;
  const trainerToggleInFlight = useRef(new Set<string>());
  const noteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const entryNoteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // Auto-detect connectionId for the trainee's own calendar
  useEffect(() => {
    if (connectionIdProp || !isOwnCalendar || !user) {
      return;
    }
    const unsub = subscribeToTraineeConnection(user.uid, (conn) => {
      setAutoConnectionId(conn?.status === 'active' ? conn.id : null);
    });

    return unsub;
  }, [connectionIdProp, isOwnCalendar, user]);

  // Calendar data subscriptions
  // Only reads calendarEntries (legacy `calendar` path was migrated via
  // migrate-to-calendar-entries — no fallback needed).
  useEffect(() => {
    if (!targetUserId) {
      return;
    }
    const unsubEntries = subscribeToCalendarEntries(
      targetUserId,
      setCalendarEntries,
    );
    const unsubNotes = subscribeToCalendarNotes(targetUserId, setCalendarNotes);
    const unsubCategories = subscribeToActivityCategories(
      targetUserId,
      setCategories,
      DEFAULT_CATEGORIES,
    );
    const unsubTrainerCal = subscribeToTrainerCalendar(
      targetUserId,
      setTrainerCalendar,
    );

    return () => {
      unsubEntries();
      unsubNotes();
      unsubCategories();
      unsubTrainerCal();
    };
  }, [targetUserId]);

  // Training sessions subscription
  useEffect(() => {
    if (!connectionId) {
      return;
    }
    const unsub = subscribeToTrainingSessions(
      connectionId,
      setTrainingSessions,
    );

    return unsub;
  }, [connectionId]);

  // Trainer category for display (prefer non-archived; fall back to archived for history)
  const trainerCategoryForDisplay = useMemo(
    () =>
      categories.find((c) => c.trainerId && !c.archived) ??
      categories.find((c) => !!c.trainerId) ??
      null,
    [categories],
  );

  // Categories available for adding new entries (strip archived + trainer-linked)
  const pickableCategories = useMemo(
    () => categories.filter((c) => !c.archived && !c.trainerId),
    [categories],
  );

  // All displayable categories (including trainer) for the modal event list
  const displayCategories = useMemo(
    () => categories.filter((c) => !c.archived),
    [categories],
  );

  // Recent activity IDs (sorted by most recently used across all dates)
  const recentActivityIds = useMemo((): string[] => {
    if (!calendarEntries) {
      return [];
    }
    const seen = new Set<string>();
    const result: string[] = [];
    const dates = Object.keys(calendarEntries).sort().reverse();
    for (const d of dates) {
      for (const entry of Object.values(calendarEntries[d])) {
        if (
          entry.type === 'activity' &&
          entry.activityId &&
          !seen.has(entry.activityId)
        ) {
          seen.add(entry.activityId);
          result.push(entry.activityId);
        }
      }
    }

    return result;
  }, [calendarEntries]);

  // ── Handlers ──────────────────────────────────────────────────────────────

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
    async (entryData: Omit<CalendarEntry, 'id'>, date: string) => {
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
    async (newCategory: ActivityCategory) => {
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

  // Clear pending note saves on unmount
  const clearTimers = useCallback(() => {
    if (noteTimerRef.current) {
      clearTimeout(noteTimerRef.current);
    }
    entryNoteTimersRef.current.forEach(clearTimeout);
    entryNoteTimersRef.current.clear();
  }, []);

  return {
    calendarEntries,
    calendarNotes,
    trainerCalendar,
    categories,
    trainingSessions,
    targetUserId,
    connectionId,
    trainerCategoryForDisplay,
    pickableCategories,
    displayCategories,
    recentActivityIds,
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
