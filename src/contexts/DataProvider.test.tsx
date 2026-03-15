import type { IRow } from '@app-types/types';
import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from './AuthContext';
import { DataProvider } from './DataProvider';
import { useDataSet } from './useDataSet';

const mockLoadUserData = vi.fn();
const mockSaveUserData = vi.fn().mockResolvedValue(undefined);

vi.mock('@firebase-config/database', () => ({
  loadUserData: (...args: unknown[]) => mockLoadUserData(...args),
  saveUserData: (...args: unknown[]) => mockSaveUserData(...args),
}));

vi.mock('@lib/data-format', () => ({
  fromFirebaseFormat: (data: unknown[]) =>
    (data as Array<{ date: string }>).map((r, i) => ({
      ...r,
      id: i + 1,
      date: new Date(`${r.date}T00:00:00`),
    })),
}));

const fakeUser = {
  uid: 'user-1',
} as unknown as User;

const makeWrapper =
  (user: User | null = fakeUser) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider
      value={{ user, loading: false, isAdmin: false, isTrainer: false }}
    >
      <DataProvider>{children}</DataProvider>
    </AuthContext.Provider>
  );

describe('DataProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLoadUserData.mockResolvedValue([
      {
        date: '2025-03-15',
        kcal: 2000,
        protein: 150,
        carbs: 200,
        fat: 80,
        weight: 75.5,
        completed: false,
      },
    ]);
  });

  it('loads data from Firebase on mount', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useDataSet(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockLoadUserData).toHaveBeenCalledWith('user-1');
    expect(result.current.dataSet).toHaveLength(1);
    expect(result.current.dataSet?.[0].kcal).toBe(2000);
  });

  it('stays in loading state when no user on initial mount', () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useDataSet(), {
      wrapper: makeWrapper(null),
    });

    // DataProvider's prevUserId starts as null, matching null user,
    // so the effect early-returns and state stays loading.
    // In production this path doesn't occur because AuthProvider
    // gates rendering until auth resolves.
    expect(result.current.isLoading).toBe(true);
    expect(result.current.dataSet).toBeNull();
  });

  it('returns null dataSet when Firebase returns null', async () => {
    vi.useRealTimers();
    mockLoadUserData.mockResolvedValue(null);

    const { result } = renderHook(() => useDataSet(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dataSet).toBeNull();
  });

  it('saves data to Firebase with debounce on setDataSet', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useDataSet(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.useFakeTimers();

    const newRow: IRow = {
      id: 2,
      date: new Date('2025-03-16'),
      kcal: 1800,
      protein: 120,
      carbs: 180,
      fat: 70,
      weight: 75.0,
      completed: false,
    };

    act(() => {
      result.current.setDataSet([result.current.dataSet![0], newRow]);
    });

    // Not saved yet (debounce)
    expect(mockSaveUserData).not.toHaveBeenCalled();

    // Advance past debounce (500ms)
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(mockSaveUserData).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({ date: '2025-03-16', kcal: 1800 }),
      ]),
    );
  });

  it('supports function updater in setDataSet', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useDataSet(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.dataSet).toHaveLength(1);
    });

    act(() => {
      result.current.setDataSet((prev) => {
        if (!prev) {
          return prev;
        }

        return prev.map((row) => ({ ...row, kcal: 9999 }));
      });
    });

    expect(result.current.dataSet?.[0].kcal).toBe(9999);
  });
});
