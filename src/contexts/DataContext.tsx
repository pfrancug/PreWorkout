import type { IRow } from '../types/types';

import {
  type ReactNode,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  type IRowData,
  loadUserData,
  saveUserData,
} from '../firebase/database';
import { DataContext } from './DataContextDef';
import { useAuth } from './useAuth';

// Convert IRow to IRowData for Firebase storage
const toFirebaseFormat = (rows: IRow[]): IRowData[] =>
  rows.map((row) => ({
    ...row,
    date: row.date.toISOString(),
  }));

// Convert IRowData from Firebase to IRow
const fromFirebaseFormat = (data: IRowData[]): IRow[] =>
  data.map((row) => ({
    ...row,
    date: new Date(row.date),
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
            saveUserData(user.uid, toFirebaseFormat(dataToSave));
          }
        }, 500);
      }
    },
    [user],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <DataContext.Provider value={{ dataSet, setDataSet, isLoading }}>
      {children}
    </DataContext.Provider>
  );
};
