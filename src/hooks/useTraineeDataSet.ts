import type { IRow } from '../types/types';

import { useEffect, useState } from 'react';

import { loadUserData } from '../firebase/database';
import { fromFirebaseFormat } from '../lib/data-format';

/**
 * Hook to load a trainee's diary data (read-only).
 * Loads once on mount / when traineeId changes.
 */
export const useTraineeDataSet = (traineeId: string | undefined) => {
  const [dataSet, setDataSet] = useState<IRow[] | null>(null);
  const [loadedForId, setLoadedForId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!traineeId) {
      return;
    }

    let cancelled = false;

    loadUserData(traineeId)
      .then((data) => {
        if (cancelled) {
          return;
        }

        setDataSet(data ? fromFirebaseFormat(data) : null);
        setLoadedForId(traineeId);
      })
      .catch(() => {
        if (!cancelled) {
          setDataSet(null);
          setLoadedForId(traineeId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [traineeId]);

  // Derive loading / visible data without synchronous setState
  const isLoading = !!traineeId && loadedForId !== traineeId;
  const visibleData = traineeId && loadedForId === traineeId ? dataSet : null;

  return { dataSet: visibleData, isLoading };
};
