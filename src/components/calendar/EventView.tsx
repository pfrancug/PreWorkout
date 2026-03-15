import type { EditEntryFormData } from './schemas';
import type { EventViewProps } from './types';
import type { SubmitHandler } from 'react-hook-form';

import { ActivityIcon } from '@components/ActivityIcon';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { ACTIVITY_COLOR_MAP } from '@constants/activities';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Clock, Pencil, Trash2 } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { editEntrySchema } from './schemas';

export const EventView = ({
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
    getValues,
    setValue: setEventValue,
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
            aria-label={t('calendar.back')}
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
            {entry.timeEnd && ` â€“ ${entry.timeEnd}`}
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
          <span className={'text-sm text-muted-foreground'}>{'â€“'}</span>
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
                onCheckedChange={(v) => {
                  field.onChange(!!v);
                  if (!v && !getValues('time') && !getValues('timeEnd')) {
                    setEventValue('time', '13:00');
                    setEventValue('timeEnd', '14:00');
                  }
                }}
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
