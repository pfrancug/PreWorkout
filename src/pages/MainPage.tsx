import { SparkChart } from '@components/charts/SparkChart';
import { TodayPanel } from '@components/TodayPanel';
import { useDataSet } from '@contexts/useDataSet';
import { useTranslation } from 'react-i18next';

export const MainPage = () => {
  const { t } = useTranslation();
  const { dataSet } = useDataSet();

  return (
    <div
      className={'mx-auto w-full max-w-3xl space-y-4 p-4 lg:space-y-8 lg:p-6'}
    >
      {/* Page header */}
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('dashboard.title')}
        </h1>

        <p className={'text-muted-foreground'}>{t('dashboard.description')}</p>
      </div>

      {/* Spark charts */}
      <div className={'grid grid-cols-2 gap-4 lg:gap-8'}>
        <SparkChart data={dataSet} value={'weight'} />

        <SparkChart data={dataSet} value={'kcal'} />
      </div>

      {/* Today */}
      <TodayPanel />
    </div>
  );
};
