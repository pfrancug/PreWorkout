import type { AddEventFormData } from './schemas';
import type { AddViewProps } from './types';
import type { ActivityIconId } from '@constants/activities';
import type { IActivityCategory } from '@firebase-config/database';
import type { SubmitHandler } from 'react-hook-form';

import { ActivityIcon } from '@components/ActivityIcon';
import { IconColorPicker } from '@components/IconColorPicker';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { ACTIVITY_COLOR_MAP } from '@constants/activities';
import { EN_DASH } from '@constants/display';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@lib/utils';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { addEventSchema } from './schemas';

export const AddView = ({
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
    getValues,
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
      time: '13:00',
      timeEnd: '14:00',
    },
  });

  const watchedActivityId = useWatch({ control, name: 'activityId' });
  const nameValue = useWatch({ control, name: 'name' });
  const allDay = useWatch({ control, name: 'allDay' });
  const iconValue = useWatch({ control, name: 'icon' }) as ActivityIconId;
  const colorValue = useWatch({ control, name: 'color' });

  const canSaveToActivities = !watchedActivityId && !!nameValue?.trim();

  const [showAllCategories, setShowAllCategories] = useState(false);

  const { recentCategories, remainingCategories } = useMemo(() => {
    const recentSet = new Set(recentActivityIds);
    const recent: IActivityCategory[] = [];
    const remaining: IActivityCategory[] = [];

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
      setValue('time', '');
      setValue('timeEnd', '');
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
      const newCategory: IActivityCategory = {
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
            aria-label={t('calendar.back')}
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
                  onCheckedChange={(v) => {
                    field.onChange(!!v);
                    if (!v && !getValues('time') && !getValues('timeEnd')) {
                      setValue('time', '13:00');
                      setValue('timeEnd', '14:00');
                    }
                  }}
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
            <span className={'text-sm text-muted-foreground'}>{EN_DASH}</span>
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
