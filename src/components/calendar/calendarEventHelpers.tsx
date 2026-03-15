import type { GetDrawerEntriesParams } from './types';
import type { MapCalendarEventsParams } from './types';
import type { IFullCalendarEventMeta } from '@app-types/types';
import type { ICalendarEntry } from '@firebase-config/database';
import type { EventContentArg, EventInput } from '@fullcalendar/core';
import type { TFunction } from 'i18next';

import { ActivityIcon } from '@components/ActivityIcon';
import { ACTIVITY_COLOR_MAP } from '@constants/activities';
import { cn } from '@lib/utils';
import { Dumbbell, Pencil, StickyNote } from 'lucide-react';

export const mapCalendarEvents = ({
  calendarEntries,
  calendarNotes,
  trainerCalendar,
  categories,
  trainingSessions,
  trainerCategoryForDisplay,
  t,
}: MapCalendarEventsParams): EventInput[] => {
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
    // AND no timed session exists â€” timed sessions get their own event below)
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
            } satisfies ICalendarEntry,
            category: trainerCategoryForDisplay,
          } as IFullCalendarEventMeta,
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
          ? (category?.name ??
            entry.activityId ??
            t('calendar.fallbackActivityTitle'))
          : (entry.name ?? t('calendar.fallbackCustomTitle'));

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
        } as IFullCalendarEventMeta,
      });
    }
  }

  // Training session events â€” only timed sessions get their own event
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
      } as IFullCalendarEventMeta,
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
      } as IFullCalendarEventMeta,
    });
  }

  return result;
};

// â”€â”€ Custom event renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const renderEventContent = (arg: EventContentArg, t: TFunction) => {
  const meta = arg.event.extendedProps as IFullCalendarEventMeta;

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
        <span className={cn('h-2 w-2 shrink-0 rounded-full', payDotClass)} />
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
};

// â”€â”€ Drawer entries helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getDrawerEntries = ({
  date,
  calendarEntries,
  trainerCalendar,
  trainerCategoryForDisplay,
  trainingSessions,
}: GetDrawerEntriesParams): ICalendarEntry[] => {
  if (!date) {
    return [];
  }

  const entries = calendarEntries?.[date]
    ? Object.values(calendarEntries[date])
    : [];

  // Include virtual trainer-day entry if not already logged as a real entry
  // AND no timed session exists (timed sessions get their own virtual entry below)
  if (trainerCategoryForDisplay && trainerCalendar?.[date]) {
    const alreadyLogged = entries.some(
      (e) =>
        e.type === 'activity' && e.activityId === trainerCategoryForDisplay.id,
    );
    const hasTimedSession = trainingSessions.some(
      (s) => s.date === date && s.status !== 'cancelled' && s.time,
    );
    if (!alreadyLogged && !hasTimedSession) {
      const matchingSession = trainingSessions.find(
        (s) => s.date === date && s.status !== 'cancelled',
      );
      entries.push({
        id: `trainer-${date}`,
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
      session.date === date &&
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
};
