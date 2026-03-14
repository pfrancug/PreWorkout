import type { ActivityCategory, CalendarEntry } from '../firebase/database';
import type { SubmitHandler } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@lib/utils';
import { ArrowLeft, ChevronDown, Clock, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { ACTIVITY_COLOR_MAP } from '../constants/activities';
import { ActivityIcon } from './ActivityIcon';
import { IconColorPicker } from './IconColorPicker';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

// -- Types -------------------------------------------------------------------

export interface TimePreset {
  startStr: string;
  endStr: string;
  allDay: boolean;
}

export type DrawerView =
  | { view: 'day'; date: string }
  | { view: 'event'; date: string; entryId: string }
  | { view: 'add'; date: string; timePreset: TimePreset | null }
  | { view: 'note'; date: string };

// -- Zod schema --------------------------------------------------------------

const addEventSchema = z
  .object({
    activityId: z.string().optional(),
    name: z.string().max(100).optional(),
    saveToActivities: z.boolean(),
    icon: z.string(),
    color: z.string(),
    allDay: z.boolean(),
    time: z.string().optional(),
    timeEnd: z.string().optional(),
    note: z.string().max(500).optional(),
  })
  .refine((d) => !!d.activityId || !!d.name?.trim(), {
    message: 'Select an activity or enter a name',
    path: ['activityId'],
  })
  .refine((d) => d.allDay || (!!d.time && !!d.timeEnd), {
    message: 'Add start and end time',
    path: ['time'],
  });

type AddEventFormData = z.infer<typeof addEventSchema>;

const editEntrySchema = z
  .object({
    note: z.string().max(500),
    time: z.string().optional(),
    timeEnd: z.string().optional(),
    allDay: z.boolean(),
  })
  .refine((d) => d.allDay || (!!d.time && !!d.timeEnd), {
    message: 'Add start and end time',
    path: ['time'],
  });
type EditEntryFormData = z.infer<typeof editEntrySchema>;

// -- Props -------------------------------------------------------------------

interface ActivityNoteModalProps {
  drawerView: DrawerView;
  categories: ActivityCategory[];
  /** All entries already logged for the current date */
  entries: CalendarEntry[];
  /** Activity IDs ordered by most recently used (across all dates) */
  recentActivityIds: string[];
  /** Current day note text */
  note: string;
  onNavigate: (next: DrawerView) => void;
  onClose: () => void;
  onNoteChange: (value: string) => void;
  onAddEntry: (entry: Omit<CalendarEntry, 'id'>) => Promise<void>;
  onDeleteEntry: (entryId: string, date: string) => Promise<void>;
  onUpdateEntryNote: (entryId: string, date: string, note: string) => void;
  onUpdateEntryTime: (
    entryId: string,
    date: string,
    time: string | null,
    timeEnd?: string | null,
  ) => void;
  onSaveNewCategory: (category: ActivityCategory) => Promise<void>;
}

// -- Day View ----------------------------------------------------------------

interface DayViewProps {
  date: string;
  categories: ActivityCategory[];
  entries: CalendarEntry[];
  note: string;
  onNavigateToEvent: (entryId: string) => void;
  onNavigateToAdd: () => void;
  onNavigateToNote: () => void;
}

const DayView = ({
  date,
  categories,
  entries,
  note,
  onNavigateToEvent,
  onNavigateToAdd,
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

              return (
                <button
                  key={entry.id}
                  onClick={() => onNavigateToEvent(entry.id)}
                  type={'button'}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:opacity-80',
                  )}
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
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={'flex gap-2'}>
        <Button
          className={'flex-1'}
          onClick={onNavigateToAdd}
          variant={'outline'}
        >
          {t('calendar.addEventButton')}
        </Button>

        <Button
          className={'flex-1'}
          onClick={onNavigateToNote}
          variant={'outline'}
        >
          {note ? t('calendar.dayNote') : t('calendar.addDayNote')}
        </Button>
      </div>
    </>
  );
};

// -- Note View ---------------------------------------------------------------

interface NoteViewProps {
  note: string;
  onBack: () => void;
  onNoteChange: (value: string) => void;
}

const noteSchema = z.object({
  note: z.string().max(1000),
});
type NoteFormData = z.infer<typeof noteSchema>;

const NoteView = ({ note, onBack, onNoteChange }: NoteViewProps) => {
  const { t } = useTranslation();

  const { register, handleSubmit } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note },
  });

  const onSubmit: SubmitHandler<NoteFormData> = (data) => {
    onNoteChange(data.note.trim());
    onBack();
  };

  return (
    <>
      <DialogHeader>
        <div className={'flex items-center gap-2'}>
          <button
            onClick={onBack}
            type={'button'}
            className={
              'cursor-pointer text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            <ArrowLeft className={'h-4 w-4'} />
          </button>
          <DialogTitle className={'text-base'}>
            {t('calendar.dayNote')}
          </DialogTitle>
        </div>
      </DialogHeader>

      {/* Note content */}
      <div className={'space-y-2'}>
        <Textarea
          {...register('note')}
          autoFocus
          className={'resize-none text-sm'}
          maxLength={1000}
          placeholder={t('calendar.notePlaceholder')}
          rows={4}
        />
      </div>

      {/* Action buttons */}
      <div className={'flex gap-2'}>
        <Button
          className={'flex-1'}
          onClick={handleSubmit(onSubmit)}
          type={'button'}
        >
          {t('calendar.saveChanges')}
        </Button>
        <Button
          className={'flex-1 gap-2'}
          variant={'destructive'}
          onClick={() => {
            onNoteChange('');
            onBack();
          }}
        >
          <Trash2 className={'h-4 w-4'} />
          {t('calendar.deleteEvent')}
        </Button>
      </div>
    </>
  );
};

// -- Event View --------------------------------------------------------------

interface EventViewProps {
  date: string;
  entry: CalendarEntry;
  categories: ActivityCategory[];
  onBack: () => void;
  onDelete: () => void;
  onUpdateNote: (note: string) => void;
  onUpdateTime: (time: string | null, timeEnd?: string | null) => void;
}

const EventView = ({
  date,
  entry,
  categories,
  onBack,
  onDelete,
  onUpdateNote,
  onUpdateTime,
}: EventViewProps) => {
  const { t } = useTranslation();

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
    : entry.color
      ? (ACTIVITY_COLOR_MAP[entry.color] ?? '#94a3b8')
      : '#94a3b8';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditEntryFormData>({
    resolver: zodResolver(editEntrySchema),
    shouldFocusError: false,
    defaultValues: {
      note: entry.note ?? '',
      time: entry.time ?? '',
      timeEnd: entry.timeEnd ?? '',
      allDay: !entry.time,
    },
  });

  const allDay = useWatch({ control, name: 'allDay' });

  const onSubmit: SubmitHandler<EditEntryFormData> = (data) => {
    onUpdateNote(data.note.trim());
    const newTime = data.allDay ? null : data.time || null;
    const newTimeEnd = data.allDay ? null : data.timeEnd || null;
    if (newTime !== entry.time || newTimeEnd !== (entry.timeEnd ?? null)) {
      onUpdateTime(newTime, newTimeEnd);
    }
    onBack();
  };

  return (
    <>
      <DialogHeader>
        <div className={'flex items-center gap-2'}>
          <button
            onClick={onBack}
            type={'button'}
            className={
              'cursor-pointer text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            <ArrowLeft className={'h-4 w-4'} />
          </button>
          <DialogTitle className={'text-base'}>{displayName}</DialogTitle>
        </div>
      </DialogHeader>

      {/* Event card */}
      <div
        className={'flex items-center gap-3 rounded-lg border px-4 py-3'}
        style={{
          backgroundColor: `${entryColor}1a`,
          borderColor: `${entryColor}60`,
        }}
      >
        {category ? (
          <ActivityIcon
            className={'h-5 w-5 shrink-0'}
            iconId={category.icon}
            style={{ color: entryColor }}
          />
        ) : entry.icon ? (
          <ActivityIcon
            className={'h-5 w-5 shrink-0'}
            iconId={entry.icon}
            style={{ color: entryColor }}
          />
        ) : (
          <Pencil
            className={'h-5 w-5 shrink-0'}
            style={{ color: entryColor }}
          />
        )}
        <div className={'flex flex-1 flex-col gap-0.5'}>
          <span className={'text-sm font-medium'} style={{ color: entryColor }}>
            {displayName}
          </span>
          <span className={'text-xs text-muted-foreground'}>{date}</span>
        </div>
        {entry.time && (
          <span
            className={'flex items-center gap-1 text-xs text-muted-foreground'}
          >
            <Clock className={'h-3.5 w-3.5'} />
            {entry.time}
            {entry.timeEnd && ` – ${entry.timeEnd}`}
          </span>
        )}
      </div>

      {/* Time section */}
      <div className={'space-y-1.5'}>
        <label className={'text-sm font-medium'} htmlFor={'editTime'}>
          {t('calendar.timeLabel')}
        </label>
        <div className={'flex items-center gap-2'}>
          <Input
            {...register('time')}
            className={'flex-1'}
            disabled={allDay}
            id={'editTime'}
            type={'time'}
          />
          <span className={'text-sm text-muted-foreground'}>{'–'}</span>
          <Input
            {...register('timeEnd')}
            className={'flex-1'}
            disabled={allDay}
            id={'editTimeEnd'}
            type={'time'}
          />
        </div>
        <div className={'flex items-center gap-2'}>
          <Controller
            control={control}
            name={'allDay'}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                id={'editAllDay'}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <label className={'cursor-pointer text-sm'} htmlFor={'editAllDay'}>
            {t('calendar.allDay')}
          </label>
        </div>
        {errors.time && (
          <p className={'text-xs text-destructive'}>{errors.time.message}</p>
        )}
      </div>

      {/* Note section */}
      <div className={'space-y-2'}>
        <p className={'text-sm font-medium'}>{t('calendar.eventNote')}</p>
        <form className={'space-y-2'} onSubmit={handleSubmit(onSubmit)}>
          <Textarea
            {...register('note')}
            className={'resize-none text-sm'}
            maxLength={500}
            placeholder={t('calendar.activityNotePlaceholder')}
            rows={3}
          />
        </form>
      </div>

      {/* Action buttons */}
      <div className={'flex gap-2'}>
        <Button
          className={'flex-1'}
          onClick={handleSubmit(onSubmit)}
          type={'button'}
        >
          {t('calendar.saveChanges')}
        </Button>
        <Button
          className={'flex-1 gap-2'}
          onClick={onDelete}
          variant={'destructive'}
        >
          <Trash2 className={'h-4 w-4'} />
          {t('calendar.deleteEvent')}
        </Button>
      </div>
    </>
  );
};

// -- Add View ----------------------------------------------------------------

interface AddViewProps {
  date: string;
  timePreset: TimePreset | null;
  categories: ActivityCategory[];
  recentActivityIds: string[];
  onBack: () => void;
  onAddEntry: (entry: Omit<CalendarEntry, 'id'>) => Promise<void>;
  onSaveNewCategory: (category: ActivityCategory) => Promise<void>;
}

const AddView = ({
  date,
  timePreset,
  categories,
  recentActivityIds,
  onBack,
  onAddEntry,
  onSaveNewCategory,
}: AddViewProps) => {
  const { t, i18n } = useTranslation();

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(
    i18n.language,
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  );

  const {
    control,
    handleSubmit,
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddEventFormData>({
    resolver: zodResolver(addEventSchema),
    shouldFocusError: false,
    defaultValues: {
      saveToActivities: false,
      icon: 'dumbbell',
      color: 'slate',
      allDay: false,
      time: '12:00',
      timeEnd: '13:00',
    },
  });

  const watchedActivityId = useWatch({ control, name: 'activityId' });
  const nameValue = useWatch({ control, name: 'name' });
  const allDay = useWatch({ control, name: 'allDay' });
  const iconValue = useWatch({ control, name: 'icon' });
  const colorValue = useWatch({ control, name: 'color' });

  const canSaveToActivities = !watchedActivityId && !!nameValue?.trim();

  const [showAllCategories, setShowAllCategories] = useState(false);

  const { recentCategories, remainingCategories } = useMemo(() => {
    const recentSet = new Set(recentActivityIds);
    const recent: ActivityCategory[] = [];
    const remaining: ActivityCategory[] = [];

    for (const id of recentActivityIds) {
      const cat = categories.find((c) => c.id === id);
      if (cat) {
        recent.push(cat);
      }
    }

    for (const cat of categories) {
      if (!recentSet.has(cat.id)) {
        remaining.push(cat);
      }
    }

    return {
      recentCategories: recent.slice(0, 3),
      remainingCategories: [...recent.slice(3), ...remaining],
    };
  }, [categories, recentActivityIds]);

  useEffect(() => {
    if (!timePreset) {
      return;
    }
    if (timePreset.allDay) {
      setValue('allDay', true);
      setValue('time', '12:00');
      setValue('timeEnd', '13:00');
    } else {
      setValue('allDay', false);
      if (timePreset.startStr.length >= 16) {
        setValue('time', timePreset.startStr.substring(11, 16));
      }
      if (timePreset.endStr.length >= 16) {
        setValue('timeEnd', timePreset.endStr.substring(11, 16));
      }
    }
  }, [timePreset, setValue]);

  const onSubmit: SubmitHandler<AddEventFormData> = async (data) => {
    const base = {
      time: data.allDay ? null : data.time!,
      timeEnd: data.allDay ? null : data.timeEnd || null,
      ...(data.note?.trim() ? { note: data.note.trim() } : {}),
    };

    if (data.activityId) {
      await onAddEntry({
        ...base,
        type: 'activity',
        activityId: data.activityId,
      });
    } else if (data.saveToActivities) {
      const newCategory: ActivityCategory = {
        id: `custom-${crypto.randomUUID()}`,
        name: data.name!.trim(),
        icon: data.icon,
        color: data.color,
      };
      await onSaveNewCategory(newCategory);
      await onAddEntry({
        ...base,
        type: 'activity',
        activityId: newCategory.id,
      });
    } else {
      await onAddEntry({
        ...base,
        type: 'custom',
        name: data.name!.trim(),
        icon: data.icon,
        color: data.color,
      });
    }

    onBack();
  };

  return (
    <>
      <DialogHeader>
        <div className={'flex items-center gap-2'}>
          <button
            onClick={onBack}
            type={'button'}
            className={
              'cursor-pointer text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            <ArrowLeft className={'h-4 w-4'} />
          </button>
          <DialogTitle className={'text-base'}>{formattedDate}</DialogTitle>
        </div>
      </DialogHeader>

      <form className={'space-y-3'} onSubmit={handleSubmit(onSubmit)}>
        {/* Activity */}
        <div className={'space-y-1.5'}>
          <label className={'text-sm font-medium'}>
            {t('calendar.activityLabel')}
          </label>

          {/* Custom name input */}
          <div className={'flex items-center gap-2'}>
            <IconColorPicker
              color={colorValue}
              icon={iconValue}
              onColorChange={(id) => setValue('color', id)}
              onIconChange={(id) => setValue('icon', id)}
            />
            <Input
              {...register('name', {
                onChange: (e) => {
                  if (e.target.value) {
                    setValue('activityId', undefined);
                  }
                },
              })}
              disabled={!!watchedActivityId}
              id={'eventName'}
              maxLength={100}
              placeholder={t('calendar.eventNamePlaceholder')}
            />
          </div>

          {/* Save as new activity checkbox */}
          <div className={'flex items-center gap-2'}>
            <Controller
              control={control}
              name={'saveToActivities'}
              render={({ field }) => (
                <Checkbox
                  checked={field.value && canSaveToActivities}
                  disabled={!canSaveToActivities}
                  id={'saveToActivities'}
                  onCheckedChange={(v) => field.onChange(!!v)}
                />
              )}
            />
            <label
              htmlFor={'saveToActivities'}
              className={cn(
                'text-sm',
                canSaveToActivities
                  ? 'cursor-pointer'
                  : 'text-muted-foreground',
              )}
            >
              {t('calendar.saveToActivities')}
            </label>
          </div>

          {/* Divider */}
          <div className={'flex items-center gap-2 py-1'}>
            <div className={'h-px flex-1 bg-border'} />
            <span className={'text-xs text-muted-foreground'}>
              {t('calendar.orFromLibrary')}
            </span>
            <div className={'h-px flex-1 bg-border'} />
          </div>

          {/* Category buttons */}
          <div className={'space-y-1'}>
            {(showAllCategories
              ? [...recentCategories, ...remainingCategories]
              : recentCategories
            ).map((category) => {
              const c = ACTIVITY_COLOR_MAP[category.color] ?? '#888';
              const isSelected = watchedActivityId === category.id;

              return (
                <button
                  key={category.id}
                  type={'button'}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                    isSelected
                      ? 'border-transparent'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                  onClick={() => {
                    if (isSelected) {
                      setValue('activityId', undefined);
                    } else {
                      setValue('activityId', category.id);
                      setValue('name', '');
                      setValue('icon', category.icon);
                      setValue('color', category.color);
                    }
                  }}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${c}26`,
                          borderColor: c,
                          color: c,
                        }
                      : undefined
                  }
                >
                  <ActivityIcon
                    className={'h-4 w-4 shrink-0'}
                    iconId={category.icon}
                  />
                  <span className={'flex-1 text-left'}>{category.name}</span>
                </button>
              );
            })}
          </div>
          {!showAllCategories && remainingCategories.length > 0 && (
            <button
              onClick={() => setShowAllCategories(true)}
              type={'button'}
              className={
                'flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground'
              }
            >
              <ChevronDown className={'h-3.5 w-3.5'} />
              {t('calendar.showAllActivities')}
            </button>
          )}

          {errors.activityId && (
            <p className={'text-xs text-destructive'}>
              {errors.activityId.message}
            </p>
          )}
        </div>

        {/* Time */}
        <div className={'space-y-1.5'}>
          <label className={'text-sm font-medium'} htmlFor={'eventTime'}>
            {t('calendar.timeLabel')}
          </label>
          <div className={'flex items-center gap-2'}>
            <Input
              {...register('time')}
              className={'flex-1'}
              disabled={allDay}
              id={'eventTime'}
              type={'time'}
            />
            <span className={'text-sm text-muted-foreground'}>{'–'}</span>
            <Input
              {...register('timeEnd')}
              className={'flex-1'}
              disabled={allDay}
              id={'eventTimeEnd'}
              type={'time'}
            />
          </div>
          <div className={'flex items-center gap-2'}>
            <Controller
              control={control}
              name={'allDay'}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  id={'allDay'}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <label className={'cursor-pointer text-sm'} htmlFor={'allDay'}>
              {t('calendar.allDay')}
            </label>
          </div>
          {errors.time && (
            <p className={'text-xs text-destructive'}>{errors.time.message}</p>
          )}
        </div>

        {/* Note */}
        <div className={'space-y-1.5'}>
          <label className={'text-sm font-medium'} htmlFor={'eventNote'}>
            {t('calendar.noteLabel')}
          </label>
          <Textarea
            {...register('note')}
            className={'resize-none text-sm'}
            id={'eventNote'}
            maxLength={500}
            placeholder={t('calendar.activityNotePlaceholder')}
            rows={2}
          />
        </div>

        <Button className={'w-full'} disabled={isSubmitting} type={'submit'}>
          {t('calendar.addToCalendar')}
        </Button>
      </form>
    </>
  );
};

// -- Main component ----------------------------------------------------------

export const ActivityNoteModal = ({
  drawerView,
  categories,
  entries,
  recentActivityIds,
  note,
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
            onNavigateToAdd={() =>
              onNavigate({ view: 'add', date, timePreset: null })
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
            onNoteChange={onNoteChange}
          />
        )}

        {drawerView.view === 'event' && currentEntry && (
          <EventView
            categories={categories}
            date={date}
            entry={currentEntry}
            key={currentEntry.id}
            onBack={() => onNavigate({ view: 'day', date })}
            onDelete={() => {
              onDeleteEntry(currentEntry.id, date);
              onNavigate({ view: 'day', date });
            }}
            onUpdateNote={(noteValue) =>
              onUpdateEntryNote(currentEntry.id, date, noteValue)
            }
            onUpdateTime={(time, timeEnd) =>
              onUpdateEntryTime(currentEntry.id, date, time, timeEnd)
            }
          />
        )}

        {drawerView.view === 'add' && (
          <AddView
            categories={categories}
            date={date}
            onAddEntry={onAddEntry}
            onBack={() => onNavigate({ view: 'day', date })}
            onSaveNewCategory={onSaveNewCategory}
            recentActivityIds={recentActivityIds}
            timePreset={drawerView.timePreset}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
