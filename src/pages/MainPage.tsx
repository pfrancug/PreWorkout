import { SparkChart } from '@components/charts/SparkChart';

import { useDataSet } from '../hooks/useDataSet';

export const MainPage = () => {
  const { dataSet } = useDataSet();

  return (
    <div className={'mx-auto w-full max-w-screen-2xl p-6'}>
      <div className={'grid gap-4 lg:gap-6'}>
        {/* Chart Section */}
        <div className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
          <SparkChart color={'primary'} data={dataSet} value={'weight'} />

          <SparkChart color={'warning'} data={dataSet} value={'kcal'} />

          <SparkChart color={'success'} data={dataSet} value={'protein'} />
        </div>
      </div>
    </div>
  );
};
