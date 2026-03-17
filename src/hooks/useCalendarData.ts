import type { UseCalendarDataOptions } from './types';
import type { ITrainingSession } from '@app-types/types';
import type {
  IActivityCategory,
  ICalendarEntries,
  ICalendarNotes,
} from '@firebase-config/database';

import { DEFAULT_CATEGORIES } from '@constants/activities';
import { useAuth } from '@contexts/useAuth';
import {
  subscribeToActivityCategories,
  subscribeToCalendarEntries,
  subscribeToCalendarNotes,
  subscribeToTraineeConnection,
  subscribeToTrainingSessions,
} from '@firebase-config/database';
import { useEffect, useMemo, useState } from 'react';

import { useCalendarHandlers } from './useCalendarHandlers';

export const useCalendarData = ({
  userId: propUserId,
  connectionId: connectionIdProp,
}: UseCalendarDataOptions) => {
  const { user } = useAuth();

  const [calendarEntries, setCalendarEntries] =
    useState<ICalendarEntries | null>(null);
  const [calendarNotes, setCalendarNotes] = useState<ICalendarNotes | null>(
    null,
  );
  const [categories, setCategories] = useState<IActivityCategory[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<ITrainingSession[]>(
    [],
  );
  const [autoConnectionId, setAutoConnectionId] = useState<string | null>(null);

  const targetUserId = propUserId || user?.uid;
  const isOwnCalendar = !propUserId || propUserId === user?.uid;
  const connectionId = connectionIdProp ?? autoConnectionId ?? undefined;

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

    return () => {
      unsubEntries();
      unsubNotes();
      unsubCategories();
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

  // Categories available for adding new entries (strip archived)
  const pickableCategories = useMemo(
    () => categories.filter((c) => !c.archived),
    [categories],
  );

  // All displayable categories for the modal event list
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

  const handlers = useCalendarHandlers({
    user,
    targetUserId,
    connectionId,
    categories,
    trainingSessions,
  });

  return {
    calendarEntries,
    calendarNotes,
    categories,
    trainingSessions,
    targetUserId,
    connectionId,
    pickableCategories,
    displayCategories,
    recentActivityIds,
    ...handlers,
  };
};
