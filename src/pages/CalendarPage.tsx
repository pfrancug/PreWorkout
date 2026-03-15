import { FullCalendarView } from '@components/FullCalendarView';
import { useTranslation } from 'react-i18next';

export const CalendarPage = () => {
  const { t } = useTranslation();

  return (
    <div
      className={'mx-auto w-full max-w-3xl space-y-4 p-4 lg:space-y-8 lg:p-6'}
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('calendar.title')}
        </h1>

        <p className={'text-muted-foreground'}>{t('calendar.description')}</p>
      </div>

      <FullCalendarView />
    </div>
  );
};
