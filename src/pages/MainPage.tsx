import type { IRow } from '../types/types';

import { Grid, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import { SparkChart } from '../charts/SparkChart';
import { Chat } from '../components/Chat';
import { DataTable } from '../components/DataTable/DataTable';

export const MainPage = () => {
  const [dataSet, setDataSet] = useState<IRow[] | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem('dataSet');

    if (storedData) {
      const parsedData = JSON.parse(storedData).map((row: IRow) => ({
        ...row,
        date: new Date(row.date),
      }));

      setDataSet(parsedData);
    }
  }, []);

  useEffect(() => {
    if (dataSet) {
      localStorage.setItem('dataSet', JSON.stringify(dataSet));
    }
  }, [dataSet]);

  return (
    <>
      <Grid container spacing={3}>
        {/* ---- Chart Section ---- */}

        <Grid container size={12} spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <SparkChart color={'primary'} data={dataSet} value={'weight'} />
          </Grid>

          <Grid size={{ xs: 6, lg: 4 }}>
            <SparkChart color={'warning'} data={dataSet} value={'kcal'} />
          </Grid>

          <Grid size={{ xs: 6, lg: 4 }}>
            <SparkChart color={'success'} data={dataSet} value={'protein'} />
          </Grid>
        </Grid>

        {/* ---- Data Grid Section ---- */}

        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack>
            <Stack height={650} width={'100%'}>
              <DataTable dataSet={dataSet} setDataSet={setDataSet} />
            </Stack>
          </Stack>
        </Grid>

        {/* ---- Chat Section ---- */}

        <Grid size={{ xs: 12, lg: 6 }}>
          <Chat dataset={dataSet} />
        </Grid>
      </Grid>
    </>
  );
};
