import type { IRow } from '../types/types';

import { Container, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loader } from '../components/Loader';
import { useAuth } from '../contexts/useAuth';
import { LoginPage } from '../pages/LoginPage';
import { MainPage } from '../pages/MainPage';

export const MainApp = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

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

  const content = useMemo(() => {
    if (loading) {
      return <Loader />;
    }

    if (!loading && !user) {
      return <LoginPage />;
    }

    if (!loading && user) {
      return <MainPage />;
    }

    return null;
  }, [loading, user]);

  return (
    <Container
      maxWidth={'xl'}
      sx={{
        p: (theme) =>
          `${isMobile ? theme.spacing(2) : theme.spacing(3)} !important`,
        width: '100%',
        height: '100vh',
      }}
    >
      {content}
    </Container>
  );
};
