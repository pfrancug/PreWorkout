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
  createCalendarEntry,
  deleteCalendarEntry,
  saveActivityCategories,
  saveCalendarNote,
  subscribeToActivityCategories,
  subscribeToCalendarEntries,
  subscribeToCalendarNotes,
  subscribeToTraineeConnection,
  subscribeToTrainerCalendar,
  subscribeToTrainingSessions,
  updateCalendarEntryNote,
} from '../firebase/database';
import { ActivityIcon } from './ActivityIcon';
import { ActivityNoteModal } from './ActivityNoteModal';

const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const FullCalendarView = () => {
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
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [drawerView, setDrawerView] = useState<DrawerView | null>(null);

  const noteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const entryNoteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

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
    const unsubEntries = subscribeToCalendarEntries(
      user.uid,
      setCalendarEntries,
    );
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

    return () => {
      unsubEntries();
      unsubNotes();
      unsubCategories();
      unsubTrainerCal();
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
      entryNoteTimersRef.current.forEach(clearTimeout);
      entryNoteTimersRef.current.clear();
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

  // Categories available in the modal (strip archived + trainer-linked)
  const pickableCategories = useMemo(
    () => categories.filter((c) => !c.archived && !c.trainerId),
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

      // Virtual trainer-day event (only if not already logged as an entry)
      if (trainerCategoryForDisplay && trainerCalendar?.[dateKey]) {
        const alreadyLogged = dayEntries.some(
          (e) =>
            e.type === 'activity' &&
            e.activityId === trainerCategoryForDisplay.id,
        );
        if (!alreadyLogged) {
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
          : '#94a3b8';
        const title =
          entry.type === 'activity'
            ? (category?.name ?? entry.activityId ?? 'Activity')
            : (entry.name ?? 'Custom');

        result.push({
          id: `entry-${dateKey}-${entry.id}`,
          title,
          start: entry.time ? `${dateKey}T${entry.time}:00` : dateKey,
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
    setDrawerView({ view: 'day', date: formatDateKey(arg.date) });
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const meta = arg.event.extendedProps as FullCalendarEventMeta;
    if (meta.type === 'entry' && arg.event.start) {
      const date = formatDateKey(arg.event.start);
      const entryId = meta.entry?.id;
      if (entryId && !entryId.startsWith('trainer-')) {
        setDrawerView({ view: 'event', date, entryId });
      } else {
        setDrawerView({ view: 'day', date });
      }
    } else if (meta.type === 'note') {
      const dateKey =
        (meta.dateKey as string | undefined) ??
        (arg.event.start ? formatDateKey(arg.event.start) : null);
      if (dateKey) {
        setDrawerView({ view: 'day', date: dateKey });
      }
    }
    // Training session events are read-only; no modal opened
  }, []);

  const handleSelect = useCallback((arg: DateSelectArg) => {
    const date = formatDateKey(arg.start);
    const timePreset: TimePreset = {
      startStr: arg.startStr,
      allDay: arg.allDay,
    };
    setDrawerView({ view: 'add', date, timePreset });
  }, []);

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
        await deleteCalendarEntry(user.uid, date, entryId);
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, t],
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
          : '#94a3b8';

        return (
          <div className={'flex items-center gap-1 overflow-hidden px-1'}>
            {entry?.type === 'activity' && category ? (
              <ActivityIcon
                className={'h-3.5 w-3.5 shrink-0'}
                iconId={category.icon}
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
    if (!drawerDate || !calendarEntries?.[drawerDate]) {
      return [];
    }

    return Object.values(calendarEntries[drawerDate]);
  }, [drawerDate, calendarEntries]);

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
          selectable
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
          select={handleSelect}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
        />
      </div>

      {drawerView && (
        <ActivityNoteModal
          categories={pickableCategories}
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
        />
      )}
    </>
  );
};
