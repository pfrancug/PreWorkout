import type { IRow } from '../types/types';

import { useCallback, useState } from 'react';

import { STORAGE_KEYS } from '../constants/storage';

function getInitialDataSet(): IRow[] | null {
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.DATA_SET);
    if (storedData) {
      return JSON.parse(storedData).map((row: IRow) => ({
        ...row,
        date: new Date(row.date),
      }));
    }
  } catch {
    // Invalid JSON
  }

  return null;
}

export function useDataSet() {
  const [dataSet, setDataSetState] = useState<IRow[] | null>(getInitialDataSet);

  // Persist data to localStorage when it changes
  const setDataSet = useCallback(
    (data: IRow[] | null | ((prev: IRow[] | null) => IRow[] | null)) => {
      setDataSetState((prev) => {
        const newData = typeof data === 'function' ? data(prev) : data;
        if (newData) {
          localStorage.setItem(STORAGE_KEYS.DATA_SET, JSON.stringify(newData));
        }

        return newData;
      });
    },
    [],
  );

  return { dataSet, setDataSet };
}
