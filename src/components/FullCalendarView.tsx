import type { ModalView, TimePreset } from './calendar/types';
import type { FullCalendarViewProps } from './types';
import type { IFullCalendarEventMeta } from '@app-types/types';
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';

import { useSettings } from '@contexts/useSettings';
import plLocale from '@fullcalendar/core/locales/pl';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useCalendarData } from '@hooks/useCalendarData';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActivityNoteModal } from './ActivityNoteModal';
import {
  getModalEntries,
  getModalSessions,
  mapCalendarEvents,
  renderEventContent,
} from './calendar/calendarEventHelpers';

const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const FullCalendarView = ({
  userId: propUserId,
  readOnly = false,
  allowTrainerToggle = false,
  connectionId: connectionIdProp,
}: FullCalendarViewProps) => {
  const { t, i18n } = useTranslation();
  const { preferences } = useSettings();

  const {
    calendarEntries,
    calendarNotes,
    categories,
    trainingSessions,
    connectionId,
    pickableCategories,
    displayCategories,
    recentActivityIds,
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
  } = useCalendarData({
    userId: propUserId,
    connectionId: connectionIdProp,
    readOnly,
    allowTrainerToggle,
  });

  const [modalView, setModalView] = useState<ModalView | null>(null);

  // Clear pending note saves when selected date changes or component unmounts
  useEffect(() => {
    return clearTimers;
  }, [modalView?.date, clearTimers]);

  // ── Event mapping ──────────────────────────────────────────────────────────

  const events = useMemo(
    () =>
      mapCalendarEvents({
        calendarEntries,
        calendarNotes,
        categories,
        trainingSessions,
        t,
      }),
    [calendarEntries, calendarNotes, categories, trainingSessions, t],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDateClick = useCallback((arg: DateClickArg) => {
    const date = formatDateKey(arg.date);
    if (arg.allDay) {
      setModalView({ view: 'day', date });
    } else {
      const hh = String(arg.date.getHours()).padStart(2, '0');
      const mm = String(arg.date.getMinutes()).padStart(2, '0');
      const endDate = new Date(arg.date.getTime() + 60 * 60 * 1000);
      const ehh = String(endDate.getHours()).padStart(2, '0');
      const emm = String(endDate.getMinutes()).padStart(2, '0');
      setModalView({
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

      const meta = arg.event.extendedProps as IFullCalendarEventMeta;
      if (meta.type === 'entry' && arg.event.start) {
        const date = formatDateKey(arg.event.start);
        const entryId = meta.entry?.id;
        if (readOnly) {
          setModalView({ view: 'day', date });
        } else if (entryId && !entryId.startsWith('trainer-')) {
          setModalView({ view: 'event', date, entryId });
        } else {
          setModalView({ view: 'day', date });
        }
      } else if (meta.type === 'note') {
        if (readOnly) {
          const date = arg.event.start ? formatDateKey(arg.event.start) : null;
          if (date) {
            setModalView({ view: 'day', date });
          }
        } else {
          const dateKey =
            (meta.dateKey as string | undefined) ??
            (arg.event.start ? formatDateKey(arg.event.start) : null);
          if (dateKey) {
            setModalView({ view: 'note', date: dateKey });
          }
        }
      } else if (meta.type === 'trainingSession' && arg.event.start) {
        const date = formatDateKey(arg.event.start);
        const sessionId = meta.session?.id;
        if (readOnly && allowTrainerToggle && sessionId) {
          setModalView({
            view: 'event',
            date,
            entryId: `session-${sessionId}`,
          });
        } else {
          setModalView({ view: 'day', date });
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
        setModalView({ view: 'add-training', date, timePreset });
      } else if (!readOnly) {
        setModalView({ view: 'add', date, timePreset });
      }
    },
    [readOnly, allowTrainerToggle],
  );

  const eventContentRenderer = useCallback(
    (arg: Parameters<typeof renderEventContent>[0]) =>
      renderEventContent(arg, t),
    [t],
  );

  // ── Derived modal state ───────────────────────────────────────────────────

  const modalDate = modalView?.date ?? null;

  const modalEntries = useMemo(
    () =>
      getModalEntries({
        date: modalDate,
        calendarEntries,
      }),
    [modalDate, calendarEntries],
  );

  const modalSessions = useMemo(
    () =>
      getModalSessions({
        date: modalDate,
        trainingSessions,
      }),
    [modalDate, trainingSessions],
  );

  const modalNote = useMemo(
    () => (modalDate ? (calendarNotes?.[modalDate] ?? '') : ''),
    [modalDate, calendarNotes],
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
          eventContent={eventContentRenderer}
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

      {modalView && (
        <ActivityNoteModal
          canAddTraining={allowTrainerToggle && !!connectionId}
          categories={displayCategories}
          entries={modalEntries}
          modalView={modalView}
          note={modalNote}
          onAddEntry={(entryData) => handleAddEntry(entryData, modalView.date)}
          onAddTrainingSession={handleAddTrainingSession}
          onClose={() => setModalView(null)}
          onDeleteEntry={handleDeleteEntry}
          onDeleteSession={handleDeleteSession}
          onNavigate={setModalView}
          onNoteChange={(value) => handleNoteChange(value, modalView.date)}
          onSaveNewCategory={handleSaveNewCategory}
          onUpdateEntryNote={handleUpdateEntryNote}
          onUpdateEntryTime={handleUpdateEntryTime}
          onUpdateSessionNote={handleUpdateSessionNote}
          onUpdateSessionTime={handleUpdateSessionTime}
          pickableCategories={pickableCategories}
          readOnly={readOnly}
          recentActivityIds={recentActivityIds}
          sessions={modalSessions}
        />
      )}
    </>
  );
};
