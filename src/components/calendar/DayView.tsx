import type { DayViewProps } from './types';
import type { ITrainingSession } from '@app-types/types';

import { ActivityIcon } from '@components/ActivityIcon';
import { Button } from '@components/ui/button';
import { DialogHeader, DialogTitle } from '@components/ui/dialog';
import { ACTIVITY_COLOR_MAP } from '@constants/activities';
import { EN_DASH } from '@constants/display';
import { cn } from '@lib/utils';
import { Clock, Dumbbell, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const paymentDotClass = (session: ITrainingSession) => {
  if (session.paymentStatus === 'paid') {
    return 'bg-green-500';
  }
  if (session.paymentStatus === 'pending') {
    return 'bg-yellow-500';
  }

  return 'bg-red-500';
};

export const DayView = ({
  date,
  categories,
  entries,
  sessions,
  note,
  readOnly,
  canAddTraining,
  onNavigateToEvent,
  onNavigateToSession,
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

      {/* Activities list */}
      <div className={'space-y-2'}>
        <p className={'text-sm font-medium'}>{t('calendar.loggedEvents')}</p>

        {entries.length === 0 && sessions.length === 0 ? (
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

              return (
                <div
                  key={entry.id}
                  role={readOnly ? undefined : 'button'}
                  tabIndex={readOnly ? undefined : 0}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left',
                    !readOnly &&
                      'cursor-pointer transition-colors hover:opacity-80',
                  )}
                  onClick={
                    readOnly ? undefined : () => onNavigateToEvent(entry.id)
                  }
                  onKeyDown={
                    readOnly
                      ? undefined
                      : (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onNavigateToEvent(entry.id);
                          }
                        }
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
                      {entry.timeEnd && ` – ${entry.timeEnd}`}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Training sessions */}
            {sessions.map((session) => {
              const isCompleted = session.status === 'completed';
              const sessionColor = isCompleted ? '#22c55e' : '#3b82f6';

              return (
                <div
                  key={`session-${session.id}`}
                  role={canAddTraining ? 'button' : undefined}
                  tabIndex={canAddTraining ? 0 : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left',
                    canAddTraining &&
                      'cursor-pointer transition-colors hover:opacity-80',
                  )}
                  onClick={
                    canAddTraining
                      ? () => onNavigateToSession(session.id)
                      : undefined
                  }
                  onKeyDown={
                    canAddTraining
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onNavigateToSession(session.id);
                          }
                        }
                      : undefined
                  }
                  style={{
                    backgroundColor: `${sessionColor}1a`,
                    borderColor: `${sessionColor}60`,
                  }}
                >
                  <Dumbbell
                    className={'h-4 w-4 shrink-0'}
                    style={{ color: sessionColor }}
                  />
                  <div className={'flex flex-1 flex-col gap-0.5'}>
                    <span className={'text-sm'} style={{ color: sessionColor }}>
                      {t('calendar.trainerActivity')}
                    </span>
                    {session.note && (
                      <span
                        className={'text-xs text-muted-foreground line-clamp-1'}
                      >
                        {session.note}
                      </span>
                    )}
                  </div>
                  <div className={'flex shrink-0 items-center gap-2'}>
                    {session.time && (
                      <span
                        className={
                          'flex items-center gap-1 text-xs text-muted-foreground'
                        }
                      >
                        <Clock className={'h-3 w-3'} />
                        {session.time}
                        {session.timeEnd && ` ${EN_DASH} ${session.timeEnd}`}
                      </span>
                    )}
                    <span
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        paymentDotClass(session),
                      )}
                    />
                  </div>
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

        {canAddTraining && (
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
