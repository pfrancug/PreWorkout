import type { ActivityNoteModalProps } from './types';

import { useTranslation } from 'react-i18next';

import { AddTrainingView } from './calendar/AddTrainingView';
import { AddView } from './calendar/AddView';
import { DayView } from './calendar/DayView';
import { EventView } from './calendar/EventView';
import { NoteView } from './calendar/NoteView';
import { Dialog, DialogContent } from './ui/dialog';

export type { ModalView, TimePreset } from './calendar/types';

export const ActivityNoteModal = ({
  modalView,
  categories,
  pickableCategories,
  entries,
  sessions,
  recentActivityIds,
  note,
  readOnly = false,
  canAddTraining = false,
  onNavigate,
  onClose,
  onNoteChange,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntryNote,
  onUpdateEntryTime,
  onSaveNewCategory,
  onAddTrainingSession,
  onDeleteSession,
  onUpdateSessionNote,
  onUpdateSessionTime,
}: ActivityNoteModalProps) => {
  const { t } = useTranslation();
  const date = modalView.date;

  const currentEntry =
    modalView.view === 'event'
      ? entries.find((e) => e.id === modalView.entryId)
      : undefined;

  const isSessionEvent =
    modalView.view === 'event' && modalView.entryId?.startsWith('session-');

  const showDayView =
    modalView.view === 'day' ||
    (modalView.view === 'event' && !currentEntry && !isSessionEvent);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className={
          'flex max-h-[90vh] flex-col gap-5 overflow-y-auto sm:max-w-md'
        }
      >
        {showDayView && (
          <DayView
            canAddTraining={canAddTraining}
            categories={categories}
            date={date}
            entries={entries}
            note={note}
            onNavigateToNote={() => onNavigate({ view: 'note', date })}
            readOnly={readOnly}
            sessions={sessions}
            onNavigateToAdd={() =>
              onNavigate({
                view: 'add',
                date,
                timePreset:
                  modalView.view === 'day'
                    ? (modalView.timePreset ?? null)
                    : null,
              })
            }
            onNavigateToAddTraining={() =>
              onNavigate({
                view: 'add-training',
                date,
                timePreset:
                  modalView.view === 'day'
                    ? (modalView.timePreset ?? null)
                    : null,
              })
            }
            onNavigateToEvent={(entryId) =>
              onNavigate({ view: 'event', date, entryId })
            }
            onNavigateToSession={(sessionId) =>
              onNavigate({
                view: 'event',
                date,
                entryId: `session-${sessionId}`,
              })
            }
          />
        )}

        {modalView.view === 'note' && (
          <NoteView
            note={note}
            onBack={() => onNavigate({ view: 'day', date })}
            onNoteChange={readOnly ? () => {} : onNoteChange}
          />
        )}

        {modalView.view === 'event' &&
          currentEntry &&
          (() => {
            const canEdit = !readOnly;

            return (
              <EventView
                categories={categories}
                date={date}
                entry={currentEntry}
                key={currentEntry.id}
                onBack={() => onNavigate({ view: 'day', date })}
                onDelete={
                  canEdit
                    ? () => {
                        onDeleteEntry(currentEntry.id, date);
                        onNavigate({ view: 'day', date });
                      }
                    : () => {}
                }
                onUpdateNote={
                  canEdit
                    ? (noteValue) =>
                        onUpdateEntryNote(currentEntry.id, date, noteValue)
                    : () => {}
                }
                onUpdateTime={
                  canEdit
                    ? (time, timeEnd) =>
                        onUpdateEntryTime(currentEntry.id, date, time, timeEnd)
                    : () => {}
                }
              />
            );
          })()}

        {modalView.view === 'event' &&
          isSessionEvent &&
          (() => {
            const sessionId = modalView.entryId.replace('session-', '');
            const session = sessions.find((s) => s.id === sessionId);
            if (!session || !canAddTraining) {
              return null;
            }

            return (
              <EventView
                categories={categories}
                date={date}
                key={`session-${session.id}`}
                onBack={() => onNavigate({ view: 'day', date })}
                entry={{
                  id: `session-${session.id}`,
                  type: 'custom',
                  name: t('calendar.trainerActivity'),
                  icon: 'dumbbell',
                  color: session.status === 'completed' ? 'green' : 'blue',
                  time: session.time,
                  timeEnd: session.timeEnd ?? null,
                  note: session.note,
                }}
                onDelete={() => {
                  onDeleteSession(session.id);
                  onNavigate({ view: 'day', date });
                }}
                onUpdateNote={(noteValue) =>
                  onUpdateSessionNote(session.id, date, noteValue)
                }
                onUpdateTime={(time, timeEnd) =>
                  onUpdateSessionTime(session.id, date, time, timeEnd)
                }
              />
            );
          })()}

        {!readOnly && modalView.view === 'add' && (
          <AddView
            categories={pickableCategories ?? categories}
            date={date}
            onAddEntry={onAddEntry}
            onBack={() => onNavigate({ view: 'day', date })}
            onSaveNewCategory={onSaveNewCategory}
            recentActivityIds={recentActivityIds}
            timePreset={modalView.timePreset}
          />
        )}

        {canAddTraining && modalView.view === 'add-training' && (
          <AddTrainingView
            date={date}
            onBack={() => onNavigate({ view: 'day', date })}
            timePreset={modalView.timePreset}
            onSave={async (dateKey, time, timeEnd, noteValue) => {
              await onAddTrainingSession(dateKey, time, timeEnd, noteValue);
              onNavigate({ view: 'day', date });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
