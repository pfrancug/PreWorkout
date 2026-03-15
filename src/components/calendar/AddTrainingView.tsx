import type { EditEntryFormData } from './schemas';
import type { AddTrainingViewProps } from './types';
import type { SubmitHandler } from 'react-hook-form';

import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { EM_DASH } from '@constants/display';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { editEntrySchema } from './schemas';

export const AddTrainingView = ({
  date,
  timePreset,
  onBack,
  onSave,
}: AddTrainingViewProps) => {
  const { t, i18n } = useTranslation();

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(
    i18n.language,
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditEntryFormData>({
    resolver: zodResolver(editEntrySchema),
    shouldFocusError: false,
    defaultValues: {
      note: '',
      time: '13:00',
      timeEnd: '14:00',
      allDay: false,
    },
  });

  const allDay = useWatch({ control, name: 'allDay' });

  useEffect(() => {
    if (!timePreset) {
      return;
    }
    if (timePreset.allDay) {
      setValue('allDay', true);
      setValue('time', '');
      setValue('timeEnd', '');

      return;
    }
    setValue('allDay', false);
    if (timePreset.startStr.length >= 16) {
      setValue('time', timePreset.startStr.substring(11, 16));
    }
    if (timePreset.endStr.length >= 16) {
      setValue('timeEnd', timePreset.endStr.substring(11, 16));
    }
  }, [timePreset, setValue]);

  const onSubmit: SubmitHandler<EditEntryFormData> = async (data) => {
    const time = data.allDay ? null : data.time || null;
    const timeEnd = data.allDay ? null : data.timeEnd || null;
    await onSave(date, time, timeEnd, data.note.trim());
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
          <DialogTitle className={'text-base'}>
            {t('calendar.addPersonalTraining')}
          </DialogTitle>
        </div>
      </DialogHeader>

      <p className={'text-sm text-muted-foreground'}>{formattedDate}</p>

      <form className={'space-y-4'} onSubmit={handleSubmit(onSubmit)}>
        {/* Time section */}
        <div className={'space-y-1.5'}>
          <label className={'text-sm font-medium'} htmlFor={'trainingTime'}>
            {t('calendar.timeLabel')}
          </label>
          <div className={'flex items-center gap-2'}>
            <Input
              {...register('time')}
              className={'flex-1'}
              disabled={allDay}
              id={'trainingTime'}
              type={'time'}
            />
            <span className={'text-sm text-muted-foreground'}>{EM_DASH}</span>
            <Input
              {...register('timeEnd')}
              className={'flex-1'}
              disabled={allDay}
              id={'trainingTimeEnd'}
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
                  id={'trainingAllDay'}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <label
              className={'cursor-pointer text-sm'}
              htmlFor={'trainingAllDay'}
            >
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
          <Textarea
            {...register('note')}
            className={'resize-none text-sm'}
            maxLength={500}
            placeholder={t('calendar.activityNotePlaceholder')}
            rows={3}
          />
        </div>

        <Button className={'w-full'} disabled={isSubmitting} type={'submit'}>
          {t('calendar.addToCalendar')}
        </Button>
      </form>
    </>
  );
};
