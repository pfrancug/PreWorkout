import type { IRowData } from '../firebase/database';
import type { IRow } from '../types/types';

import { useEffect, useState } from 'react';

import { loadUserData } from '../firebase/database';

// Convert IRowData from Firebase to IRow (same logic as DataContext)
const fromFirebaseFormat = (data: IRowData[]): IRow[] =>
  data.map((row) => {
    let date: Date;

    if (row.date.includes('T')) {
      const [y, m, d] = row.date.split('T')[0].split('-').map(Number);
      date = new Date(y, m - 1, d);
    } else {
      const [y, m, d] = row.date.split('-').map(Number);
      date = new Date(y, m - 1, d);
    }

    return {
      ...row,
      date,
      completed: row.completed ?? false,
    };
  });

/**
 * Hook to load a trainee's diary data (read-only).
 * Loads once on mount / when traineeId changes.
 */
export const useTraineeDataSet = (traineeId: string | undefined) => {
  const [dataSet, setDataSet] = useState<IRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(!!traineeId);
  const [prevTraineeId, setPrevTraineeId] = useState(traineeId);

  // Adjust state during render when traineeId changes (avoids setState in effect)
  if (traineeId !== prevTraineeId) {
    setPrevTraineeId(traineeId);
    setDataSet(null);
    setIsLoading(!!traineeId);
  }

  useEffect(() => {
    if (!traineeId) {
      return;
    }

    let cancelled = false;

    loadUserData(traineeId).then((data) => {
      if (cancelled) {
        return;
      }

      setDataSet(data ? fromFirebaseFormat(data) : null);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [traineeId]);

  return { dataSet, isLoading };
};
