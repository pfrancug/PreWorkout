import type { IRowData } from './types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockSet, mockRef } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn().mockResolvedValue(undefined),
  mockRef: vi.fn((_db: unknown, path?: string) => ({ _path: path })),
}));

vi.mock('firebase/database', () => ({
  get: mockGet,
  ref: mockRef,
  set: mockSet,
}));

vi.mock('./db', () => ({ database: {} }));

import { loadUserData, saveUserData } from './diary';

const makeSnap = (exists: boolean, val?: unknown) => ({
  exists: () => exists,
  val: () => val,
});

const makeRow = (
  overrides: Partial<IRowData> & { id: number; date: string },
): IRowData => ({
  kcal: null,
  protein: null,
  carbs: null,
  fat: null,
  weight: null,
  completed: false,
  ...overrides,
});

describe('diary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveUserData', () => {
    it('sorts entries by date before saving', async () => {
      const unsorted = [
        makeRow({ id: 1, date: '2025-03-15' }),
        makeRow({ id: 2, date: '2025-01-01' }),
        makeRow({ id: 3, date: '2025-02-10' }),
      ];
      await saveUserData('uid-1', unsorted);

      const savedData = mockSet.mock.calls[0][1] as IRowData[];
      expect(savedData[0].date).toBe('2025-01-01');
      expect(savedData[1].date).toBe('2025-02-10');
      expect(savedData[2].date).toBe('2025-03-15');
    });

    it('does not mutate the original array', async () => {
      const data = [
        makeRow({ id: 1, date: '2025-03-15' }),
        makeRow({ id: 2, date: '2025-01-01' }),
      ];
      await saveUserData('uid-1', data);

      expect(data[0].date).toBe('2025-03-15');
    });

    it('writes to the correct path', async () => {
      await saveUserData('uid-1', []);

      expect(mockRef).toHaveBeenCalledWith({}, 'users/uid-1/data');
    });
  });

  describe('loadUserData', () => {
    it('returns data when it exists', async () => {
      const data = [makeRow({ id: 1, date: '2025-01-01' })];
      mockGet.mockResolvedValue(makeSnap(true, data));
      const result = await loadUserData('uid-1');

      expect(result).toEqual(data);
    });

    it('returns null when no data exists', async () => {
      mockGet.mockResolvedValue(makeSnap(false));
      const result = await loadUserData('uid-1');

      expect(result).toBeNull();
    });
  });
});
