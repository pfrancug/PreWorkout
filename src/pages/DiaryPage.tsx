import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '../components/DataTable/DataTable';
import { getColumns } from '../data/columns';
import { useDataSet } from '../hooks/useDataSet';

export const DiaryPage = () => {
  const { t } = useTranslation();
  const { dataSet, setDataSet } = useDataSet();

  const columns = useMemo(() => getColumns(t), [t]);

  return (
    <div className={'mx-auto w-full max-w-4xl flex flex-1 flex-col gap-8 p-6'}>
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('diary.title')}
        </h1>

        <p className={'text-muted-foreground'}>{t('diary.description')}</p>
      </div>

      <div className={'w-full'}>
        <DataTable
          columns={columns}
          dataSet={dataSet}
          setDataSet={setDataSet}
        />
      </div>
    </div>
  );
};
