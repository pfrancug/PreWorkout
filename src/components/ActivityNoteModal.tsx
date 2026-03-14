import type { ActivityCategory, CalendarEntry } from '../firebase/database';
import type { SubmitHandler } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@lib/utils';
import { ArrowLeft, Clock, Pencil, Settings2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import {
  ACTIVITY_COLOR_MAP,
  ACTIVITY_COLORS,
  AVAILABLE_ICONS,
} from '../constants/activities';
import { ActivityIcon } from './ActivityIcon';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';

// -- Types -------------------------------------------------------------------

export interface TimePreset {
  startStr: string;
  allDay: boolean;
}

export type DrawerView =
  | { view: 'day'; date: string }
  | { view: 'event'; date: string; entryId: string }
  | { view: 'add'; date: string; timePreset: TimePreset | null };

// -- Zod schema --------------------------------------------------------------

const addEventSchema = z
  .object({
    mode: z.enum(['library', 'custom']),
    activityId: z.string().optional(),
    name: z.string().max(100).optional(),
    saveToActivities: z.boolean(),
    icon: z.string(),
    color: z.string(),
    allDay: z.boolean(),
    time: z.string().optional(),
    note: z.string().max(500).optional(),
  })
  .refine((d) => d.mode !== 'library' || !!d.activityId, {
    message: 'Select an activity',
    path: ['activityId'],
  })
  .refine((d) => d.mode !== 'custom' || !!d.name?.trim(), {
    message: 'Name is required',
    path: ['name'],
  })
  .refine((d) => d.allDay || !!d.time, {
    message: 'Add a time',
    path: ['time'],
  });

type AddEventFormData = z.infer<typeof addEventSchema>;

const editNoteSchema = z.object({
  note: z.string().max(500),
});
type EditNoteFormData = z.infer<typeof editNoteSchema>;

// -- Props -------------------------------------------------------------------

interface ActivityNoteModalProps {
  drawerView: DrawerView;
  categories: ActivityCategory[];
  /** All entries already logged for the current date */
  entries: CalendarEntry[];
  /** Current day note text */
  note: string;
  onNavigate: (next: DrawerView) => void;
  onClose: () => void;
  onNoteChange: (value: string) => void;
  onAddEntry: (entry: Omit<CalendarEntry, 'id'>) => Promise<void>;
  onDeleteEntry: (entryId: string, date: string) => Promise<void>;
  onUpdateEntryNote: (entryId: string, date: string, note: string) => void;
  onSaveNewCategory: (category: ActivityCategory) => Promise<void>;
}

// -- Day View ----------------------------------------------------------------

interface DayViewProps {
  date: string;
  categories: ActivityCategory[];
  entries: CalendarEntry[];
  note: string;
  onNoteChange: (value: string) => void;
  onNavigateToEvent: (entryId: string) => void;
  onNavigateToAdd: () => void;
  onClose: () => void;
}

const DayView = ({
  date,
  categories,
  entries,
  note,
  onNoteChange,
  onNavigateToEvent,
  onNavigateToAdd,
  onClose,
}: DayViewProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(
    i18n.language,
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle className={'text-base'}>{formattedDate}</DialogTitle>
      </DialogHeader>

      {/* Day note */}
      <div className={'space-y-2'}>
        <label className={'text-sm font-medium'}>{t('calendar.dayNote')}</label>
        <Textarea
          className={'resize-none text-sm'}
          defaultValue={note}
          key={date}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={t('calendar.notePlaceholder')}
          rows={3}
        />
      </div>

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
                  <span
                    className={'flex-1 text-sm'}
                    style={{ color: entryColor }}
                  >
                    {displayName}
                  </span>
                  {entry.time && (
                    <span
                      className={
                        'flex items-center gap-1 text-xs text-muted-foreground'
                      }
                    >
                      <Clock className={'h-3 w-3'} />
                      {entry.time}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add event button */}
      <Button
        className={'w-full'}
        onClick={onNavigateToAdd}
        variant={'outline'}
      >
        {t('calendar.addEventButton')}
      </Button>

      {/* Manage activities link */}
      <button
        type={'button'}
        className={
          'flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground'
        }
        onClick={() => {
          navigate('/settings/categories');
          onClose();
        }}
      >
        <Settings2 className={'h-3.5 w-3.5'} />
        {t('calendar.manageActivities')}
      </button>
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
}

const EventView = ({
  date,
  entry,
  categories,
  onBack,
  onDelete,
  onUpdateNote,
}: EventViewProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

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

  const { register, handleSubmit, reset } = useForm<EditNoteFormData>({
    resolver: zodResolver(editNoteSchema),
    defaultValues: { note: entry.note ?? '' },
  });

  const onSubmit: SubmitHandler<EditNoteFormData> = (data) => {
    onUpdateNote(data.note.trim());
    setIsEditing(false);
  };

  return (
    <>
      <DialogHeader>
        <div className={'flex items-center gap-2'}>
          <button
            onClick={onBack}
            type={'button'}
            className={
              'text-muted-foreground transition-colors hover:text-foreground'
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
          </span>
        )}
      </div>

      {/* Note section */}
      <div className={'space-y-2'}>
        <p className={'text-sm font-medium'}>{t('calendar.eventNote')}</p>

        {isEditing ? (
          <form className={'space-y-2'} onSubmit={handleSubmit(onSubmit)}>
            <Textarea
              {...register('note')}
              autoFocus
              className={'resize-none text-sm'}
              maxLength={500}
              placeholder={t('calendar.activityNotePlaceholder')}
              rows={3}
            />
            <div className={'flex gap-2'}>
              <Button className={'flex-1'} size={'sm'} type={'submit'}>
                {t('calendar.saveChanges')}
              </Button>
              <Button
                className={'flex-1'}
                size={'sm'}
                type={'button'}
                variant={'outline'}
                onClick={() => {
                  reset({ note: entry.note ?? '' });
                  setIsEditing(false);
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={cn(
              'min-h-[4rem] cursor-pointer rounded-lg border border-dashed border-border px-3 py-2.5 text-sm transition-colors hover:border-foreground/30',
              !entry.note && 'text-muted-foreground',
            )}
          >
            {entry.note || t('calendar.activityNotePlaceholder')}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={'flex gap-2'}>
        {!isEditing && (
          <Button
            className={'flex-1'}
            onClick={() => setIsEditing(true)}
            variant={'outline'}
          >
            {t('calendar.editEvent')}
          </Button>
        )}
        <Button
          className={cn('gap-2', !isEditing && 'flex-1')}
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
  entries: CalendarEntry[];
  onBack: () => void;
  onAddEntry: (entry: Omit<CalendarEntry, 'id'>) => Promise<void>;
  onSaveNewCategory: (category: ActivityCategory) => Promise<void>;
}

const AddView = ({
  date,
  timePreset,
  categories,
  entries,
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
    defaultValues: {
      mode: 'library',
      saveToActivities: false,
      icon: 'dumbbell',
      color: 'slate',
      allDay: true,
    },
  });

  const mode = useWatch({ control, name: 'mode' });
  const watchedActivityId = useWatch({ control, name: 'activityId' });
  const allDay = useWatch({ control, name: 'allDay' });
  const saveToActivities = useWatch({ control, name: 'saveToActivities' });
  const iconValue = useWatch({ control, name: 'icon' });
  const colorValue = useWatch({ control, name: 'color' });

  useEffect(() => {
    if (!timePreset) {
      return;
    }
    setValue('allDay', timePreset.allDay);
    if (!timePreset.allDay && timePreset.startStr.length >= 16) {
      setValue('time', timePreset.startStr.substring(11, 16));
    }
  }, [timePreset, setValue]);

  const loggedActivityIds = new Set(
    entries
      .filter(
        (e): e is CalendarEntry & { activityId: string } =>
          e.type === 'activity' && !!e.activityId,
      )
      .map((e) => e.activityId),
  );
  const availableCategories = categories.filter(
    (c) => !loggedActivityIds.has(c.id),
  );

  const onSubmit: SubmitHandler<AddEventFormData> = async (data) => {
    const base: Omit<CalendarEntry, 'id'> = {
      type: 'activity',
      time: data.allDay ? null : data.time!,
      ...(data.note?.trim() ? { note: data.note.trim() } : {}),
    };

    if (data.mode === 'library') {
      await onAddEntry({ ...base, activityId: data.activityId! });
    } else if (data.saveToActivities) {
      const newCategory: ActivityCategory = {
        // eslint-disable-next-line react-hooks/purity
        id: `custom-${Date.now()}`,
        name: data.name!.trim(),
        icon: data.icon,
        color: data.color,
      };
      await onSaveNewCategory(newCategory);
      await onAddEntry({ ...base, activityId: newCategory.id });
    } else {
      await onAddEntry({ ...base, type: 'custom', name: data.name!.trim() });
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
              'text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            <ArrowLeft className={'h-4 w-4'} />
          </button>
          <DialogTitle className={'text-base'}>{formattedDate}</DialogTitle>
        </div>
      </DialogHeader>

      <form className={'space-y-3'} onSubmit={handleSubmit(onSubmit)}>
        {/* Mode toggle */}
        <div className={'flex overflow-hidden rounded-lg border border-border'}>
          {(['library', 'custom'] as const).map((m) => (
            <button
              key={m}
              type={'button'}
              className={cn(
                'flex-1 px-3 py-2 text-sm transition-colors',
                mode === m
                  ? 'bg-accent font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => {
                setValue('mode', m);
                setValue('activityId', undefined);
              }}
            >
              {t(
                m === 'library'
                  ? 'calendar.fromLibrary'
                  : 'calendar.customEvent',
              )}
            </button>
          ))}
        </div>

        {/* Library mode */}
        {mode === 'library' && (
          <div className={'space-y-1'}>
            {availableCategories.length === 0 ? (
              <p className={'text-sm text-muted-foreground'}>
                {t('calendar.allActivitiesLogged')}
              </p>
            ) : (
              availableCategories.map((category) => {
                const c = ACTIVITY_COLOR_MAP[category.color] ?? '#888';
                const isSelected = watchedActivityId === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => setValue('activityId', category.id)}
                    type={'button'}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                      isSelected
                        ? 'border-transparent'
                        : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
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
              })
            )}
            {errors.activityId && (
              <p className={'text-xs text-destructive'}>
                {errors.activityId.message}
              </p>
            )}
          </div>
        )}

        {/* Custom mode */}
        {mode === 'custom' && (
          <div className={'space-y-2'}>
            <Input
              {...register('name')}
              maxLength={100}
              placeholder={t('calendar.eventNamePlaceholder')}
            />
            {errors.name && (
              <p className={'text-xs text-destructive'}>
                {errors.name.message}
              </p>
            )}

            <div className={'flex items-center gap-2'}>
              <Controller
                control={control}
                name={'saveToActivities'}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    id={'saveToActivities'}
                    onCheckedChange={(v) => field.onChange(!!v)}
                  />
                )}
              />
              <label
                className={'cursor-pointer text-sm'}
                htmlFor={'saveToActivities'}
              >
                {t('calendar.saveToActivities')}
              </label>
            </div>

            {saveToActivities && (
              <div className={'space-y-3 rounded-lg border border-border p-3'}>
                <div className={'space-y-1.5'}>
                  <p className={'text-xs font-medium text-muted-foreground'}>
                    {t('calendar.iconLabel')}
                  </p>
                  <div className={'flex flex-wrap gap-1.5'}>
                    {AVAILABLE_ICONS.map(({ id, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setValue('icon', id)}
                        type={'button'}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
                          iconValue === id
                            ? 'border-foreground bg-accent'
                            : 'border-border hover:bg-accent',
                        )}
                      >
                        <Icon className={'h-4 w-4'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className={'space-y-1.5'}>
                  <p className={'text-xs font-medium text-muted-foreground'}>
                    {t('calendar.colorLabel')}
                  </p>
                  <div className={'flex flex-wrap gap-2'}>
                    {ACTIVITY_COLORS.map(({ id, hex }) => (
                      <button
                        key={id}
                        onClick={() => setValue('color', id)}
                        style={{ backgroundColor: hex }}
                        type={'button'}
                        className={cn(
                          'h-7 w-7 rounded-full border-2 transition-transform',
                          colorValue === id
                            ? 'scale-110 border-foreground'
                            : 'border-transparent',
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Time */}
        <div className={'space-y-2'}>
          <div className={'flex items-center gap-2'}>
            <Controller
              control={control}
              name={'allDay'}
              render={({ field }) => (
                <Switch
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
          {!allDay && (
            <Input {...register('time')} className={'w-auto'} type={'time'} />
          )}
          {errors.time && (
            <p className={'text-xs text-destructive'}>{errors.time.message}</p>
          )}
        </div>

        {/* Note for this occurrence */}
        <Textarea
          {...register('note')}
          className={'resize-none text-sm'}
          maxLength={500}
          placeholder={t('calendar.activityNotePlaceholder')}
          rows={2}
        />

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
  note,
  onNavigate,
  onClose,
  onNoteChange,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntryNote,
  onSaveNewCategory,
}: ActivityNoteModalProps) => {
  const date = drawerView.date;

  const currentEntry =
    drawerView.view === 'event'
      ? entries.find((e) => e.id === drawerView.entryId)
      : undefined;

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
        {drawerView.view === 'day' && (
          <DayView
            categories={categories}
            date={date}
            entries={entries}
            note={note}
            onClose={onClose}
            onNoteChange={onNoteChange}
            onNavigateToAdd={() =>
              onNavigate({ view: 'add', date, timePreset: null })
            }
            onNavigateToEvent={(entryId) =>
              onNavigate({ view: 'event', date, entryId })
            }
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
          />
        )}

        {drawerView.view === 'event' && !currentEntry && (
          <DayView
            categories={categories}
            date={date}
            entries={entries}
            note={note}
            onClose={onClose}
            onNoteChange={onNoteChange}
            onNavigateToAdd={() =>
              onNavigate({ view: 'add', date, timePreset: null })
            }
            onNavigateToEvent={(entryId) =>
              onNavigate({ view: 'event', date, entryId })
            }
          />
        )}

        {drawerView.view === 'add' && (
          <AddView
            categories={categories}
            date={date}
            entries={entries}
            onAddEntry={onAddEntry}
            onBack={() => onNavigate({ view: 'day', date })}
            onSaveNewCategory={onSaveNewCategory}
            timePreset={drawerView.timePreset}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
