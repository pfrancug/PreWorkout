import type { DayViewProps } from './types';

import { ActivityIcon } from '@components/ActivityIcon';
import { Button } from '@components/ui/button';
import { DialogHeader, DialogTitle } from '@components/ui/dialog';
import { ACTIVITY_COLOR_MAP } from '@constants/activities';
import { cn } from '@lib/utils';
import { Clock, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DayView = ({
  date,
  categories,
  entries,
  note,
  readOnly,
  onTrainerToggle,
  onNavigateToEvent,
  onNavigateToAdd,
  onNavigateToAddTraining,
  onNavigateToNote,
}: DayViewProps) => {
  const { t, i18n } = useTranslation();

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(
    i18n.language,
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle className={'text-base'}>{formattedDate}</DialogTitle>
      </DialogHeader>

      {note && (
        <div className={'space-y-1'}>
          <p className={'text-sm font-medium'}>{t('calendar.dayNote')}</p>
          {readOnly ? (
            <div
              className={
                'w-full rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-left text-sm whitespace-pre-wrap'
              }
            >
              {note}
            </div>
          ) : (
            <button
              onClick={onNavigateToNote}
              type={'button'}
              className={
                'w-full cursor-pointer rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-left text-sm whitespace-pre-wrap transition-colors hover:bg-accent'
              }
            >
              {note}
            </button>
          )}
        </div>
      )}

      {/* Events list */}
      <div className={'space-y-2'}>
        <p className={'text-sm font-medium'}>{t('calendar.loggedEvents')}</p>

        {entries.length === 0 ? (
          <p className={'text-sm text-muted-foreground'}>
            {t('calendar.noEventsLogged')}
          </p>
        ) : (
          <div className={'space-y-1'}>
            {entries.map((entry) => {
              const category =
                entry.type === 'activity'
                  ? categories.find((c) => c.id === entry.activityId)
                  : undefined;
              const displayName =
                entry.type === 'activity'
                  ? (category?.name ?? entry.activityId ?? '?')
                  : (entry.name ?? '?');
              const entryColor = category
                ? (ACTIVITY_COLOR_MAP[category.color] ?? '#888')
                : '#94a3b8';
              const isTrainerEntry =
                entry.id.startsWith('trainer-') ||
                entry.id.startsWith('session-');
              const isClickable = isTrainerEntry
                ? !!onTrainerToggle
                : !readOnly;

              return (
                <div
                  key={entry.id}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left',
                    isClickable &&
                      'cursor-pointer transition-colors hover:opacity-80',
                  )}
                  onClick={
                    isClickable ? () => onNavigateToEvent(entry.id) : undefined
                  }
                  onKeyDown={
                    isClickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onNavigateToEvent(entry.id);
                          }
                        }
                      : undefined
                  }
                  style={{
                    backgroundColor: `${entryColor}1a`,
                    borderColor: `${entryColor}60`,
                  }}
                >
                  {category ? (
                    <ActivityIcon
                      className={'h-4 w-4 shrink-0'}
                      iconId={category.icon}
                      style={{ color: entryColor }}
                    />
                  ) : (
                    <Pencil
                      className={'h-4 w-4 shrink-0'}
                      style={{ color: entryColor }}
                    />
                  )}
                  <div className={'flex flex-1 flex-col gap-0.5'}>
                    <span className={'text-sm'} style={{ color: entryColor }}>
                      {displayName}
                    </span>
                    {entry.note && (
                      <span
                        className={'text-xs text-muted-foreground line-clamp-1'}
                      >
                        {entry.note}
                      </span>
                    )}
                  </div>
                  {entry.time && (
                    <span
                      className={
                        'flex shrink-0 items-center gap-1 text-xs text-muted-foreground'
                      }
                    >
                      <Clock className={'h-3 w-3'} />
                      {entry.time}
                      {entry.timeEnd && ` â€“ ${entry.timeEnd}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={'flex gap-2'}>
        {!readOnly && (
          <Button
            className={'flex-1'}
            onClick={onNavigateToAdd}
            variant={'outline'}
          >
            {t('calendar.addEventButton')}
          </Button>
        )}

        {onTrainerToggle && (
          <Button
            className={'flex-1'}
            onClick={onNavigateToAddTraining}
            variant={'outline'}
          >
            {t('calendar.addPersonalTraining')}
          </Button>
        )}

        {!readOnly && (
          <Button
            className={'flex-1'}
            onClick={onNavigateToNote}
            variant={'outline'}
          >
            {note ? t('calendar.dayNote') : t('calendar.addDayNote')}
          </Button>
        )}
      </div>
    </>
  );
};
