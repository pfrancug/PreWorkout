import type { IRow } from '@app-types/types';

import { loadUserData } from '@firebase-config/database';
import { fromFirebaseFormat } from '@lib/data-format';
import { useEffect, useState } from 'react';

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
