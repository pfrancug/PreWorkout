import type { ActivityCategory, CalendarEntry } from '../firebase/database';
import type { SubmitHandler } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@lib/utils';
import { Clock, Pencil, Settings2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { Input } from './ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';

// ── Zod schema ─────────────────────────────────────────────────────────────

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

// ── Props ───────────────────────────────────────────────────────────────────

export interface TimePreset {
  startStr: string;
  allDay: boolean;
}

interface ActivityNoteModalProps {
  /** YYYY-MM-DD */
  date: string;
  /** Time preset from FullCalendar select drag */
  timePreset: TimePreset | null;
  /** Pickable categories (non-archived, non-trainer-linked) */
  categories: ActivityCategory[];
  /** All entries already logged for this date */
  entries: CalendarEntry[];
  /** Current day note text */
  note: string;
  onNoteChange: (value: string) => void;
  onAddEntry: (entry: Omit<CalendarEntry, 'id'>) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  /** Debounced in parent */
  onUpdateEntryNote: (entryId: string, note: string) => void;
  onSaveNewCategory: (category: ActivityCategory) => Promise<void>;
  onClose: () => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export const ActivityNoteModal = ({
  date,
  timePreset,
  categories,
  entries,
  note,
  onNoteChange,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntryNote,
  onSaveNewCategory,
  onClose,
}: ActivityNoteModalProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(
    i18n.language,
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  );

  // ── Form setup ────────────────────────────────────────────────────────────

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
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

  const mode = watch('mode');
  const watchedActivityId = watch('activityId');
  const allDay = watch('allDay');
  const saveToActivities = watch('saveToActivities');
  const iconValue = watch('icon');
  const colorValue = watch('color');

  // Pre-fill time from FullCalendar select drag
  useEffect(() => {
    if (!timePreset) {
      return;
    }
    setValue('allDay', timePreset.allDay);
    if (!timePreset.allDay && timePreset.startStr.length >= 16) {
      setValue('time', timePreset.startStr.substring(11, 16));
    }
  }, [timePreset, setValue]);

  // Activities already logged today — filter the library list
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

  // ── Submit ────────────────────────────────────────────────────────────────

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

    reset({
      mode: data.mode,
      saveToActivities: false,
      icon: 'dumbbell',
      color: 'slate',
      allDay: true,
      activityId: undefined,
      name: '',
      time: undefined,
      note: '',
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent
        className={'flex flex-col gap-5 overflow-y-auto'}
        side={'right'}
      >
        <SheetHeader>
          <SheetTitle className={'text-base'}>{formattedDate}</SheetTitle>
        </SheetHeader>

        {/* ── Section A: Day note ────────────────────────────────────────── */}
        <div className={'space-y-2'}>
          <label className={'text-sm font-medium'}>
            {t('calendar.dayNote')}
          </label>
          <Textarea
            className={'resize-none text-sm'}
            defaultValue={note}
            key={date}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={t('calendar.notePlaceholder')}
            rows={3}
          />
        </div>

        {/* ── Section B: Logged events ───────────────────────────────────── */}
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
                const isExpanded = expandedEntryId === entry.id;

                return (
                  <div key={entry.id}>
                    <div
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                        isExpanded && 'rounded-b-none',
                      )}
                      onClick={() =>
                        setExpandedEntryId(isExpanded ? null : entry.id)
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
                      <button
                        type={'button'}
                        className={
                          'ml-1 text-muted-foreground transition-colors hover:text-destructive'
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEntry(entry.id);
                        }}
                      >
                        <X className={'h-4 w-4'} />
                      </button>
                    </div>

                    {isExpanded && (
                      <div
                        style={{ borderColor: `${entryColor}60` }}
                        className={
                          'rounded-b-lg border border-t-0 px-3 pb-3 pt-2'
                        }
                      >
                        <Textarea
                          className={'resize-none text-sm'}
                          defaultValue={entry.note ?? ''}
                          key={`${date}-${entry.id}`}
                          placeholder={t('calendar.activityNotePlaceholder')}
                          rows={2}
                          onChange={(e) =>
                            onUpdateEntryNote(entry.id, e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section C: Add event form ──────────────────────────────────── */}
        <div className={'space-y-3'}>
          <p className={'text-sm font-medium'}>{t('calendar.addEvent')}</p>

          <form className={'space-y-3'} onSubmit={handleSubmit(onSubmit)}>
            {/* Mode toggle */}
            <div
              className={'flex overflow-hidden rounded-lg border border-border'}
            >
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
                        <span className={'flex-1 text-left'}>
                          {category.name}
                        </span>
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
                  <div
                    className={'space-y-3 rounded-lg border border-border p-3'}
                  >
                    {/* Icon picker */}
                    <div className={'space-y-1.5'}>
                      <p
                        className={'text-xs font-medium text-muted-foreground'}
                      >
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

                    {/* Color picker */}
                    <div className={'space-y-1.5'}>
                      <p
                        className={'text-xs font-medium text-muted-foreground'}
                      >
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
                <Input
                  {...register('time')}
                  className={'w-auto'}
                  type={'time'}
                />
              )}
              {errors.time && (
                <p className={'text-xs text-destructive'}>
                  {errors.time.message}
                </p>
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

            <Button
              className={'w-full'}
              disabled={isSubmitting}
              type={'submit'}
            >
              {t('calendar.addToCalendar')}
            </Button>
          </form>
        </div>

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
      </SheetContent>
    </Sheet>
  );
};
