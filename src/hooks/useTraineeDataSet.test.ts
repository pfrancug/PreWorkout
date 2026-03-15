import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTraineeDataSet } from './useTraineeDataSet';

const mockLoadUserData = vi.fn();

vi.mock('@firebase-config/database', () => ({
  loadUserData: (...args: unknown[]) => mockLoadUserData(...args),
}));

vi.mock('@lib/data-format', () => ({
  fromFirebaseFormat: (data: unknown[]) =>
    (data as Array<{ date: string }>).map((r, i) => ({
      ...r,
      id: i + 1,
      date: new Date(`${r.date}T00:00:00`),
    })),
}));

describe('useTraineeDataSet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('starts in loading state when traineeId is provided', () => {
    const { result } = renderHook(() => useTraineeDataSet('trainee-1'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.dataSet).toBeNull();
  });

  it('loads trainee data from Firebase', async () => {
    const { result } = renderHook(() => useTraineeDataSet('trainee-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockLoadUserData).toHaveBeenCalledWith('trainee-1');
    expect(result.current.dataSet).toHaveLength(1);
    expect(result.current.dataSet?.[0].kcal).toBe(2000);
  });

  it('returns null dataSet when no traineeId', () => {
    const { result } = renderHook(() => useTraineeDataSet(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.dataSet).toBeNull();
  });

  it('returns null when Firebase returns null', async () => {
    mockLoadUserData.mockResolvedValue(null);

    const { result } = renderHook(() => useTraineeDataSet('trainee-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dataSet).toBeNull();
  });

  it('reloads when traineeId changes', async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => useTraineeDataSet(id),
      { initialProps: { id: 'trainee-1' } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockLoadUserData.mockResolvedValue([
      {
        date: '2025-04-01',
        kcal: 1500,
        protein: 100,
        carbs: 150,
        fat: 60,
        weight: 70.0,
        completed: true,
      },
    ]);

    rerender({ id: 'trainee-2' });

    await waitFor(() => {
      expect(result.current.dataSet?.[0].kcal).toBe(1500);
    });

    expect(mockLoadUserData).toHaveBeenCalledWith('trainee-2');
  });

  it('handles load errors gracefully', async () => {
    mockLoadUserData.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTraineeDataSet('trainee-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dataSet).toBeNull();
  });
});
