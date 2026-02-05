import { useContext } from 'react';

import { DataContext } from '../contexts/DataContextDef';

export const useDataSet = () => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error('useDataSet must be used within a DataProvider');
  }

  return context;
};
