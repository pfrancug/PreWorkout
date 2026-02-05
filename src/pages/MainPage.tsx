import { Calendar } from '@components/Calendar';
import { SparkChart } from '@components/charts/SparkChart';
import { useTranslation } from 'react-i18next';

import { useDataSet } from '../hooks/useDataSet';

export const MainPage = () => {
  const { t } = useTranslation();
  const { dataSet } = useDataSet();

  return (
    <div className={'mx-auto w-full max-w-screen-2xl space-y-8 p-6'}>
      {/* Page header */}
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('dashboard.title')}
        </h1>

        <p className={'text-muted-foreground'}>{t('dashboard.description')}</p>
      </div>

      {/* Spark charts */}
      <div className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
        <SparkChart color={'primary'} data={dataSet} value={'weight'} />

        <SparkChart color={'warning'} data={dataSet} value={'kcal'} />

        <SparkChart color={'success'} data={dataSet} value={'protein'} />
      </div>

      {/* Calendar */}
      <Calendar />
    </div>
  );
};
