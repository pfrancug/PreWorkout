import type { NoteFormData } from './schemas';
import type { NoteViewProps } from './types';
import type { SubmitHandler } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';
import { DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { noteSchema } from './schemas';

export const NoteView = ({ note, onBack, onNoteChange }: NoteViewProps) => {
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
            {t('calendar.dayNote')}
          </DialogTitle>
        </div>
      </DialogHeader>

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
