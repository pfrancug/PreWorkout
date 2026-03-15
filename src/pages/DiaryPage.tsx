import { DataTable } from '@components/dataTable/DataTable';
import { useDataSet } from '@contexts/useDataSet';
import { getColumns } from '@data/columns';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const DiaryPage = () => {
  const { t } = useTranslation();
  const { dataSet, setDataSet } = useDataSet();

  const columns = useMemo(() => getColumns(t), [t]);

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
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
