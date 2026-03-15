import type { ActivityNoteModalProps } from './types';

import { AddTrainingView } from './calendar/AddTrainingView';
import { AddView } from './calendar/AddView';
import { DayView } from './calendar/DayView';
import { EventView } from './calendar/EventView';
import { NoteView } from './calendar/NoteView';
import { Dialog, DialogContent } from './ui/dialog';

export type { DrawerView, TimePreset } from './calendar/types';

export const ActivityNoteModal = ({
  drawerView,
  categories,
  pickableCategories,
  entries,
  recentActivityIds,
  note,
  readOnly = false,
  onTrainerToggle,
  onNavigate,
  onClose,
  onNoteChange,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntryNote,
  onUpdateEntryTime,
  onSaveNewCategory,
}: ActivityNoteModalProps) => {
  const date = drawerView.date;

  const currentEntry =
    drawerView.view === 'event'
      ? entries.find((e) => e.id === drawerView.entryId)
      : undefined;

  const showDayView =
    drawerView.view === 'day' || (drawerView.view === 'event' && !currentEntry);

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
            categories={categories}
            date={date}
            entries={entries}
            note={note}
            onNavigateToNote={() => onNavigate({ view: 'note', date })}
            onTrainerToggle={onTrainerToggle}
            readOnly={readOnly}
            onNavigateToAdd={() =>
              onNavigate({
                view: 'add',
                date,
                timePreset:
                  drawerView.view === 'day'
                    ? (drawerView.timePreset ?? null)
                    : null,
              })
            }
            onNavigateToAddTraining={() =>
              onNavigate({
                view: 'add-training',
                date,
                timePreset:
                  drawerView.view === 'day'
                    ? (drawerView.timePreset ?? null)
                    : null,
              })
            }
            onNavigateToEvent={(entryId) =>
              onNavigate({ view: 'event', date, entryId })
            }
          />
        )}

        {drawerView.view === 'note' && (
          <NoteView
            note={note}
            onBack={() => onNavigate({ view: 'day', date })}
            onNoteChange={readOnly ? () => {} : onNoteChange}
          />
        )}

        {drawerView.view === 'event' &&
          currentEntry &&
          (() => {
            const isTrainerEntry =
              currentEntry.id.startsWith('trainer-') ||
              currentEntry.id.startsWith('session-');
            const canEdit = isTrainerEntry ? !!onTrainerToggle : !readOnly;

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

        {!readOnly && drawerView.view === 'add' && (
          <AddView
            categories={pickableCategories ?? categories}
            date={date}
            onAddEntry={onAddEntry}
            onBack={() => onNavigate({ view: 'day', date })}
            onSaveNewCategory={onSaveNewCategory}
            recentActivityIds={recentActivityIds}
            timePreset={drawerView.timePreset}
          />
        )}

        {onTrainerToggle && drawerView.view === 'add-training' && (
          <AddTrainingView
            date={date}
            onBack={() => onNavigate({ view: 'day', date })}
            timePreset={drawerView.timePreset}
            onSave={async (dateKey, time, timeEnd, noteValue) => {
              await onTrainerToggle(dateKey, time, timeEnd, noteValue);
              onNavigate({ view: 'day', date });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
