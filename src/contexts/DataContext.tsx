import type { IRowData } from '../firebase/database';
import type { IRow } from '../types/types';
import type { ReactNode } from 'react';

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { loadUserData, saveUserData } from '../firebase/database';
import { fromFirebaseFormat } from '../lib/data-format';
import { DataContext } from './DataContextDef';
import { useAuth } from './useAuth';

// Convert IRow to IRowData for Firebase storage
// Format date as YYYY-MM-DD in local timezone to avoid UTC shift
const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
};

const toFirebaseFormat = (rows: IRow[]): IRowData[] =>
  rows.map((row) => ({
    ...row,
    date: toLocalDateString(row.date),
  }));

// Wrapper type to track loading state without separate setState
type DataState =
  | { status: 'loading' }
  | { status: 'loaded'; data: IRow[] | null };

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<DataState>({ status: 'loading' });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevUserId = useRef<string | null>(null);
  const pendingSaveRef = useRef<IRow[] | null>(null);

  // Load data once on user change
  useEffect(() => {
    const userId = user?.uid ?? null;

    // Only reload if user changed
    if (userId === prevUserId.current) {
      return;
    }

    prevUserId.current = userId;

    if (!userId) {
      startTransition(() => {
        setState({ status: 'loaded', data: null });
      });

      return;
    }

    startTransition(() => {
      setState({ status: 'loading' });
    });

    loadUserData(userId).then((data) => {
      startTransition(() => {
        setState({
          status: 'loaded',
          data: data ? fromFirebaseFormat(data) : null,
        });
      });
    });
  }, [user]);

  const dataSet = state.status === 'loaded' ? state.data : null;
  const isLoading = state.status === 'loading';

  // State setter that also saves to Firebase (debounced)
  const setDataSet = useCallback(
    (data: IRow[] | null | ((prev: IRow[] | null) => IRow[] | null)) => {
      setState((prevState) => {
        const currentData =
          prevState.status === 'loaded' ? prevState.data : null;
        const newData = typeof data === 'function' ? data(currentData) : data;

        // Store for pending save
        pendingSaveRef.current = newData;

        return { status: 'loaded', data: newData };
      });

      // Schedule debounced save (uses ref to get latest data)
      if (user) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          const dataToSave = pendingSaveRef.current;
          if (dataToSave) {
            saveUserData(user.uid, toFirebaseFormat(dataToSave)).catch(() => {
              toast.error('Failed to save data.');
            });
          }
        }, 500);
      }
    },
    [user],
  );

  // Flush pending save on unmount to prevent data loss
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const dataToSave = pendingSaveRef.current;
      const userId = user?.uid;
      if (dataToSave && userId) {
        // Fire-and-forget: save pending data before unmount
        saveUserData(userId, toFirebaseFormat(dataToSave)).catch(() => {
          // Can't show toast during unmount, fail silently
        });
        pendingSaveRef.current = null;
      }
    };
  }, [user]);

  return (
    <DataContext.Provider value={{ dataSet, setDataSet, isLoading }}>
      {children}
    </DataContext.Provider>
  );
};
