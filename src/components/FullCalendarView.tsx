import type {
  ActivityCategory,
  CalendarEntries,
  CalendarEntry,
  CalendarNotes,
  TrainerCalendarData,
} from '../firebase/database';
import type { FullCalendarEventMeta, ITrainingSession } from '../types/types';
import type { DrawerView, TimePreset } from './ActivityNoteModal';
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';

import plLocale from '@fullcalendar/core/locales/pl';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { cn } from '@lib/utils';
import { Dumbbell, Pencil, StickyNote } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  ACTIVITY_COLOR_MAP,
  DEFAULT_CATEGORIES,
} from '../constants/activities';
import { useAuth } from '../contexts/useAuth';
import { useSettings } from '../contexts/useSettings';
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
import { ActivityIcon } from './ActivityIcon';
import { ActivityNoteModal } from './ActivityNoteModal';

const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

interface FullCalendarViewProps {
  /** Override whose data to display (defaults to current user) */
  userId?: string;
  /** When true, disable all editing (activity toggles, notes, adding entries) */
  readOnly?: boolean;
  /** Allow toggling trainer-linked activity even in readOnly mode */
  allowTrainerToggle?: boolean;
  /** The active trainer connection ID — needed for creating training sessions */
  connectionId?: string;
}

export const FullCalendarView = ({
  userId: propUserId,
  readOnly = false,
  allowTrainerToggle = false,
  connectionId: connectionIdProp,
}: FullCalendarViewProps = {}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { preferences } = useSettings();

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
  const [drawerView, setDrawerView] = useState<DrawerView | null>(null);

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

  // Training sessions subscription (read-only; session creation is trainer-only)
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

  // Clear pending note saves when selected date changes or component unmounts
  useEffect(() => {
    const timers = entryNoteTimersRef.current;

    return () => {
      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
      }
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [drawerView?.date]);

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

  // ── Event mapping ──────────────────────────────────────────────────────────

  const events = useMemo((): EventInput[] => {
    const result: EventInput[] = [];

    const allDates = new Set([
      ...Object.keys(calendarEntries ?? {}),
      ...Object.keys(trainerCalendar ?? {}),
    ]);

    for (const dateKey of allDates) {
      const dayEntries = calendarEntries?.[dateKey]
        ? Object.values(calendarEntries[dateKey])
        : [];

      // Virtual trainer-day event (only if not already logged as an entry
      // AND no timed session exists — timed sessions get their own event below)
      if (trainerCategoryForDisplay && trainerCalendar?.[dateKey]) {
        const alreadyLogged = dayEntries.some(
          (e) =>
            e.type === 'activity' &&
            e.activityId === trainerCategoryForDisplay.id,
        );
        const hasTimedSession = trainingSessions.some(
          (s) => s.date === dateKey && s.status !== 'cancelled' && s.time,
        );
        if (!alreadyLogged && !hasTimedSession) {
          const color =
            ACTIVITY_COLOR_MAP[trainerCategoryForDisplay.color] ?? '#888';
          result.push({
            id: `trainer-${dateKey}`,
            title: trainerCategoryForDisplay.name,
            start: dateKey,
            allDay: true,
            backgroundColor: `${color}26`,
            borderColor: color,
            textColor: color,
            extendedProps: {
              type: 'entry',
              entry: {
                id: `trainer-${dateKey}`,
                type: 'activity',
                activityId: trainerCategoryForDisplay.id,
                time: null,
              } satisfies CalendarEntry,
              category: trainerCategoryForDisplay,
            } as FullCalendarEventMeta,
          });
        }
      }

      for (const entry of dayEntries) {
        const category =
          entry.type === 'activity'
            ? categories.find((c) => c.id === entry.activityId)
            : undefined;
        const color = category
          ? (ACTIVITY_COLOR_MAP[category.color] ?? '#888')
          : entry.color
            ? (ACTIVITY_COLOR_MAP[entry.color] ?? '#94a3b8')
            : '#94a3b8';
        const title =
          entry.type === 'activity'
            ? (category?.name ?? entry.activityId ?? 'Activity')
            : (entry.name ?? 'Custom');

        result.push({
          id: `entry-${dateKey}-${entry.id}`,
          title,
          start: entry.time ? `${dateKey}T${entry.time}:00` : dateKey,
          end: entry.timeEnd ? `${dateKey}T${entry.timeEnd}:00` : undefined,
          allDay: !entry.time,
          backgroundColor: `${color}26`,
          borderColor: color,
          textColor: color,
          extendedProps: {
            type: 'entry',
            entry,
            category,
          } as FullCalendarEventMeta,
        });
      }
    }

    // Training session events — only timed sessions get their own event
    // (sessions without a time are already represented by the trainer activity above)
    for (const session of trainingSessions) {
      if (session.status === 'cancelled' || !session.time) {
        continue;
      }

      const isCompleted = session.status === 'completed';
      const bgColor = isCompleted ? '#22c55e26' : '#3b82f626';
      const borderColor = isCompleted ? '#22c55e' : '#3b82f6';
      const textColor = isCompleted ? '#16a34a' : '#2563eb';

      result.push({
        id: `session-${session.id}`,
        title: t('calendar.trainerActivity'),
        start: `${session.date}T${session.time}:00`,
        end: session.timeEnd
          ? `${session.date}T${session.timeEnd}:00`
          : undefined,
        allDay: false,
        backgroundColor: bgColor,
        borderColor,
        textColor,
        extendedProps: {
          type: 'trainingSession',
          session,
        } as FullCalendarEventMeta,
      });
    }

    // Day note events
    for (const [dateKey, noteText] of Object.entries(calendarNotes ?? {})) {
      if (!noteText) {
        continue;
      }
      result.push({
        id: `note-${dateKey}`,
        title: noteText,
        start: dateKey,
        allDay: true,
        backgroundColor: '#6b72800f',
        borderColor: '#6b728060',
        textColor: '#6b7280',
        extendedProps: {
          type: 'note',
          dateKey,
        } as FullCalendarEventMeta,
      });
    }

    return result;
  }, [
    calendarEntries,
    calendarNotes,
    trainerCalendar,
    categories,
    trainingSessions,
    trainerCategoryForDisplay,
    t,
  ]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDateClick = useCallback((arg: DateClickArg) => {
    const date = formatDateKey(arg.date);
    if (arg.allDay) {
      setDrawerView({ view: 'day', date });
    } else {
      const hh = String(arg.date.getHours()).padStart(2, '0');
      const mm = String(arg.date.getMinutes()).padStart(2, '0');
      const endDate = new Date(arg.date.getTime() + 60 * 60 * 1000);
      const ehh = String(endDate.getHours()).padStart(2, '0');
      const emm = String(endDate.getMinutes()).padStart(2, '0');
      setDrawerView({
        view: 'day',
        date,
        timePreset: {
          startStr: `${date}T${hh}:${mm}:00`,
          endStr: `${date}T${ehh}:${emm}:00`,
          allDay: false,
        },
      });
    }
  }, []);

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      // Close the "+N more" popover when clicking an event inside it
      arg.el
        .closest('.fc-popover')
        ?.querySelector<HTMLButtonElement>('.fc-popover-close')
        ?.click();

      const meta = arg.event.extendedProps as FullCalendarEventMeta;
      if (meta.type === 'entry' && arg.event.start) {
        const date = formatDateKey(arg.event.start);
        const entryId = meta.entry?.id;
        if (readOnly) {
          // Trainer can only view the day overview, not individual events
          setDrawerView({ view: 'day', date });
        } else if (entryId && !entryId.startsWith('trainer-')) {
          setDrawerView({ view: 'event', date, entryId });
        } else {
          setDrawerView({ view: 'day', date });
        }
      } else if (meta.type === 'note') {
        if (readOnly) {
          const date = arg.event.start ? formatDateKey(arg.event.start) : null;
          if (date) {
            setDrawerView({ view: 'day', date });
          }
        } else {
          const dateKey =
            (meta.dateKey as string | undefined) ??
            (arg.event.start ? formatDateKey(arg.event.start) : null);
          if (dateKey) {
            setDrawerView({ view: 'note', date: dateKey });
          }
        }
      }
      // Training session events — only trainer can open event view
      else if (meta.type === 'trainingSession' && arg.event.start) {
        const date = formatDateKey(arg.event.start);
        const sessionId = meta.session?.id;
        if (readOnly && allowTrainerToggle && sessionId) {
          setDrawerView({
            view: 'event',
            date,
            entryId: `session-${sessionId}`,
          });
        } else {
          setDrawerView({ view: 'day', date });
        }
      }
    },
    [readOnly, allowTrainerToggle],
  );

  const handleSelect = useCallback(
    (arg: DateSelectArg) => {
      const date = formatDateKey(arg.start);
      const timePreset: TimePreset = {
        startStr: arg.startStr,
        endStr: arg.endStr,
        allDay: arg.allDay,
      };
      if (readOnly && allowTrainerToggle) {
        setDrawerView({ view: 'add-training', date, timePreset });
      } else if (!readOnly) {
        setDrawerView({ view: 'add', date, timePreset });
      }
    },
    [readOnly, allowTrainerToggle],
  );

  /** Add trainer-marked activity on a day (writes to trainerCalendar + training session) */
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
    async (entryData: Omit<CalendarEntry, 'id'>) => {
      if (!user || !drawerView) {
        return;
      }
      try {
        await createCalendarEntry(user.uid, drawerView.date, entryData);
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, drawerView, t],
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string, date: string) => {
      if (!user) {
        return;
      }
      try {
        if (entryId.startsWith('trainer-')) {
          // Delete virtual trainer-day entry: unmark the day and cancel the session
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
          // Delete a timed training session entry
          const sessionId = entryId.replace('session-', '');
          if (connectionId) {
            await cancelSession(connectionId, sessionId, 'trainer');
          }
          // Also unmark the trainer calendar day if no other sessions remain
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

      // Route trainer/session entries to session note update
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

      // Route trainer/session entries to session time update
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
    (value: string) => {
      if (!user || !drawerView) {
        return;
      }
      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
      }
      noteTimerRef.current = setTimeout(async () => {
        try {
          await saveCalendarNote(user.uid, drawerView.date, value);
        } catch {
          toast.error(t('common.saveError'));
        }
      }, 500);
    },
    [user, drawerView, t],
  );

  // ── Custom renderers ───────────────────────────────────────────────────────

  const renderEventContent = useCallback(
    (arg: EventContentArg) => {
      const meta = arg.event.extendedProps as FullCalendarEventMeta;

      if (meta.type === 'entry') {
        const entry = meta.entry;
        const category = meta.category;
        const color = category
          ? (ACTIVITY_COLOR_MAP[category.color] ?? '#888')
          : entry?.color
            ? (ACTIVITY_COLOR_MAP[entry.color] ?? '#94a3b8')
            : '#94a3b8';

        return (
          <div className={'flex items-center gap-1 overflow-hidden px-1'}>
            {entry?.type === 'activity' && category ? (
              <ActivityIcon
                className={'h-3.5 w-3.5 shrink-0'}
                iconId={category.icon}
                style={{ color }}
              />
            ) : entry?.icon ? (
              <ActivityIcon
                className={'h-3.5 w-3.5 shrink-0'}
                iconId={entry.icon}
                style={{ color }}
              />
            ) : (
              <Pencil className={'h-3.5 w-3.5 shrink-0'} style={{ color }} />
            )}
            <span className={'truncate text-xs leading-none'}>
              {arg.event.title}
            </span>
          </div>
        );
      }

      if (meta.type === 'trainingSession' && meta.session) {
        const { session } = meta;
        const payDotClass =
          session.paymentStatus === 'paid'
            ? 'bg-green-500'
            : session.paymentStatus === 'pending'
              ? 'bg-yellow-500'
              : 'bg-red-500';

        return (
          <div className={'flex items-center gap-1 overflow-hidden px-1'}>
            <Dumbbell className={'h-3.5 w-3.5 shrink-0'} />
            <span className={'flex-1 truncate text-xs leading-none'}>
              {session.time ?? t('calendar.trainerActivity')}
            </span>
            <span
              className={cn('h-2 w-2 shrink-0 rounded-full', payDotClass)}
            />
          </div>
        );
      }

      if (meta.type === 'note') {
        return (
          <div className={'flex items-center gap-1 overflow-hidden px-1'}>
            <StickyNote
              className={'h-3.5 w-3.5 shrink-0'}
              style={{ color: '#6b7280' }}
            />
            <span className={'truncate text-xs leading-none'}>
              {arg.event.title}
            </span>
          </div>
        );
      }

      return (
        <div className={'overflow-hidden px-1 text-xs'}>{arg.event.title}</div>
      );
    },
    [t],
  );

  // ── Derived drawer state ───────────────────────────────────────────────────

  const drawerDate = drawerView?.date ?? null;

  const drawerEntries = useMemo((): CalendarEntry[] => {
    if (!drawerDate) {
      return [];
    }

    const entries = calendarEntries?.[drawerDate]
      ? Object.values(calendarEntries[drawerDate])
      : [];

    // Include virtual trainer-day entry if not already logged as a real entry
    // AND no timed session exists (timed sessions get their own virtual entry below)
    if (trainerCategoryForDisplay && trainerCalendar?.[drawerDate]) {
      const alreadyLogged = entries.some(
        (e) =>
          e.type === 'activity' &&
          e.activityId === trainerCategoryForDisplay.id,
      );
      const hasTimedSession = trainingSessions.some(
        (s) => s.date === drawerDate && s.status !== 'cancelled' && s.time,
      );
      if (!alreadyLogged && !hasTimedSession) {
        // Find matching session to pull note
        const matchingSession = trainingSessions.find(
          (s) => s.date === drawerDate && s.status !== 'cancelled',
        );
        entries.push({
          id: `trainer-${drawerDate}`,
          type: 'activity',
          activityId: trainerCategoryForDisplay.id,
          time: null,
          note: matchingSession?.note,
        });
      }
    }

    // Include timed training sessions as virtual entries
    for (const session of trainingSessions) {
      if (
        session.date === drawerDate &&
        session.status !== 'cancelled' &&
        session.time
      ) {
        entries.push({
          id: `session-${session.id}`,
          type: 'activity',
          activityId: trainerCategoryForDisplay?.id ?? 'trainer',
          time: session.time,
          timeEnd: session.timeEnd ?? null,
          note: session.note,
        });
      }
    }

    return entries;
  }, [
    drawerDate,
    calendarEntries,
    trainerCalendar,
    trainerCategoryForDisplay,
    trainingSessions,
  ]);

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

  const drawerNote = useMemo(
    () => (drawerDate ? (calendarNotes?.[drawerDate] ?? '') : ''),
    [drawerDate, calendarNotes],
  );

  const initialView =
    preferences.defaultCalendarView === 'week'
      ? 'timeGridWeek'
      : 'dayGridMonth';

  return (
    <>
      <div
        className={
          'rounded-xl border border-border bg-card p-4 shadow-xs sm:p-6'
        }
      >
        <FullCalendar
          nowIndicator
          dateClick={handleDateClick}
          dayMaxEvents={3}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          events={events}
          firstDay={1}
          height={'auto'}
          initialView={initialView}
          locale={i18n.language}
          locales={[plLocale]}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          select={handleSelect}
          selectable={!readOnly || allowTrainerToggle}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          selectAllow={(info) =>
            info.start.toDateString() === info.end.toDateString() ||
            (info.allDay &&
              info.end.getTime() - info.start.getTime() <= 86400000)
          }
        />
      </div>

      {drawerView && (
        <ActivityNoteModal
          categories={displayCategories}
          drawerView={drawerView}
          entries={drawerEntries}
          note={drawerNote}
          onAddEntry={handleAddEntry}
          onClose={() => setDrawerView(null)}
          onDeleteEntry={handleDeleteEntry}
          onNavigate={setDrawerView}
          onNoteChange={handleNoteChange}
          onSaveNewCategory={handleSaveNewCategory}
          onUpdateEntryNote={handleUpdateEntryNote}
          onUpdateEntryTime={handleUpdateEntryTime}
          pickableCategories={pickableCategories}
          readOnly={readOnly}
          recentActivityIds={recentActivityIds}
          onTrainerToggle={
            allowTrainerToggle && connectionId ? handleTrainerToggle : undefined
          }
        />
      )}
    </>
  );
};
