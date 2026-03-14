import type {
  ActivityCategory,
  ActivityNotes,
  CalendarData,
  CalendarNotes,
  TrainerCalendarData,
} from '../firebase/database';
import type { FullCalendarEventMeta, ITrainingSession } from '../types/types';
import type {
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
import { Dumbbell, StickyNote } from 'lucide-react';
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
  saveActivityNote,
  saveCalendarDay,
  saveCalendarNote,
  subscribeToActivityCategories,
  subscribeToActivityNotes,
  subscribeToCalendarData,
  subscribeToCalendarNotes,
  subscribeToTraineeConnection,
  subscribeToTrainerCalendar,
  subscribeToTrainingSessions,
} from '../firebase/database';
import { ActivityIcon } from './ActivityIcon';
import { ActivityNoteModal } from './ActivityNoteModal';

const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const FullCalendarView = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { preferences } = useSettings();

  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNotes | null>(
    null,
  );
  const [trainerCalendar, setTrainerCalendar] =
    useState<TrainerCalendarData | null>(null);
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<ITrainingSession[]>(
    [],
  );
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [activityNotes, setActivityNotes] = useState<ActivityNotes | null>(
    null,
  );
  const [modalDate, setModalDate] = useState<string | null>(null);

  const noteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activityNoteTimersRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());

  // Auto-detect active trainer connection
  useEffect(() => {
    if (!user) {
      return;
    }
    const unsub = subscribeToTraineeConnection(user.uid, (conn) => {
      setConnectionId(conn?.status === 'active' ? conn.id : null);
    });

    return unsub;
  }, [user]);

  // Calendar data subscriptions
  useEffect(() => {
    if (!user) {
      return;
    }
    const unsubData = subscribeToCalendarData(user.uid, setCalendarData);
    const unsubNotes = subscribeToCalendarNotes(user.uid, setCalendarNotes);
    const unsubCategories = subscribeToActivityCategories(
      user.uid,
      setCategories,
      DEFAULT_CATEGORIES,
    );
    const unsubTrainerCal = subscribeToTrainerCalendar(
      user.uid,
      setTrainerCalendar,
    );
    const unsubActivityNotes = subscribeToActivityNotes(
      user.uid,
      setActivityNotes,
    );

    return () => {
      unsubData();
      unsubNotes();
      unsubCategories();
      unsubTrainerCal();
      unsubActivityNotes();
    };
  }, [user]);

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
    return () => {
      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
      }
      activityNoteTimersRef.current.forEach(clearTimeout);
      activityNoteTimersRef.current.clear();
    };
  }, [modalDate]);

  // Trainer category for display (prefer non-archived; fall back to archived for history)
  const trainerCategoryForDisplay = useMemo(
    () =>
      categories.find((c) => c.trainerId && !c.archived) ??
      categories.find((c) => !!c.trainerId) ??
      null,
    [categories],
  );

  // Categories available in the modal (strip archived + trainer-linked)
  const pickableCategories = useMemo(
    () => categories.filter((c) => !c.archived && !c.trainerId),
    [categories],
  );

  // ── Event mapping ──────────────────────────────────────────────────────────

  const events = useMemo((): EventInput[] => {
    const result: EventInput[] = [];

    // Activity events (merged from calendarData + trainerCalendar)
    const allDates = new Set([
      ...Object.keys(calendarData ?? {}),
      ...Object.keys(trainerCalendar ?? {}),
    ]);

    for (const dateKey of allDates) {
      const regular = calendarData?.[dateKey] ?? [];
      const activityIds = [...regular];

      // Inject trainer category if the day is marked in trainerCalendar
      if (
        trainerCategoryForDisplay &&
        trainerCalendar?.[dateKey] &&
        !activityIds.includes(trainerCategoryForDisplay.id)
      ) {
        activityIds.push(trainerCategoryForDisplay.id);
      }

      for (const activityId of activityIds) {
        const category = categories.find((c) => c.id === activityId);
        if (!category) {
          continue;
        }

        const color = ACTIVITY_COLOR_MAP[category.color] ?? '#888';
        result.push({
          id: `activity-${dateKey}-${activityId}`,
          title: category.name,
          start: dateKey,
          allDay: true,
          backgroundColor: `${color}26`,
          borderColor: color,
          textColor: color,
          extendedProps: {
            type: 'activity',
            categoryId: activityId,
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
    calendarData,
    calendarNotes,
    trainerCalendar,
    categories,
    trainingSessions,
    trainerCategoryForDisplay,
    t,
  ]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDateClick = useCallback((arg: DateClickArg) => {
    setModalDate(formatDateKey(arg.date));
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const meta = arg.event.extendedProps as FullCalendarEventMeta;
    if (meta.type === 'activity' && arg.event.start) {
      setModalDate(formatDateKey(arg.event.start));
    } else if (meta.type === 'note') {
      const dateKey =
        (meta.dateKey as string | undefined) ??
        (arg.event.start ? formatDateKey(arg.event.start) : null);
      if (dateKey) {
        setModalDate(dateKey);
      }
    }
    // Training session events are read-only; no modal opened
  }, []);

  const handleToggleActivity = useCallback(
    async (activityId: string) => {
      if (!user || !modalDate) {
        return;
      }

      const current = calendarData?.[modalDate] ?? [];
      const updated = current.includes(activityId)
        ? current.filter((a) => a !== activityId)
        : [...current, activityId];

      try {
        await saveCalendarDay(user.uid, modalDate, updated);
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, modalDate, calendarData, t],
  );

  const handleNoteChange = useCallback(
    (value: string) => {
      if (!user || !modalDate) {
        return;
      }
      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
      }
      noteTimerRef.current = setTimeout(async () => {
        try {
          await saveCalendarNote(user.uid, modalDate, value);
        } catch {
          toast.error(t('common.saveError'));
        }
      }, 500);
    },
    [user, modalDate, t],
  );

  const handleActivityNoteChange = useCallback(
    (activityId: string, value: string) => {
      if (!user || !modalDate) {
        return;
      }
      const existing = activityNoteTimersRef.current.get(activityId);
      if (existing) {
        clearTimeout(existing);
      }
      activityNoteTimersRef.current.set(
        activityId,
        setTimeout(async () => {
          try {
            await saveActivityNote(user.uid, modalDate, activityId, value);
          } catch {
            toast.error(t('common.saveError'));
          } finally {
            activityNoteTimersRef.current.delete(activityId);
          }
        }, 500),
      );
    },
    [user, modalDate, t],
  );

  // ── Custom renderers ───────────────────────────────────────────────────────

  const renderEventContent = useCallback(
    (arg: EventContentArg) => {
      const meta = arg.event.extendedProps as FullCalendarEventMeta;

      if (meta.type === 'activity' && meta.category) {
        const color = ACTIVITY_COLOR_MAP[meta.category.color] ?? '#888';

        return (
          <div className={'flex items-center gap-1 overflow-hidden px-1'}>
            <ActivityIcon
              className={'h-3.5 w-3.5 shrink-0'}
              iconId={meta.category.icon}
              style={{ color }}
            />
            <span className={'truncate text-xs leading-none'}>
              {meta.category.name}
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

  // ── Derived modal state ────────────────────────────────────────────────────

  const modalActivities = useMemo(
    () => (modalDate ? (calendarData?.[modalDate] ?? []) : []),
    [modalDate, calendarData],
  );

  const modalNote = useMemo(
    () => (modalDate ? (calendarNotes?.[modalDate] ?? '') : ''),
    [modalDate, calendarNotes],
  );

  const modalActivityNotes = useMemo(
    () => (modalDate ? (activityNotes?.[modalDate] ?? {}) : {}),
    [modalDate, activityNotes],
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
          height={'auto'}
          initialView={initialView}
          locale={i18n.language}
          locales={[plLocale]}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
        />
      </div>

      {modalDate && (
        <ActivityNoteModal
          activities={modalActivities}
          activityNotes={modalActivityNotes}
          categories={pickableCategories}
          date={modalDate}
          note={modalNote}
          onActivityNoteChange={handleActivityNoteChange}
          onClose={() => setModalDate(null)}
          onNoteChange={handleNoteChange}
          onToggleActivity={handleToggleActivity}
        />
      )}
    </>
  );
};
