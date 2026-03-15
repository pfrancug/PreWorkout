import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockSet, mockRef, mockOnValue } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn().mockResolvedValue(undefined),
  mockRef: vi.fn((_db: unknown, path?: string) => ({ _path: path })),
  mockOnValue: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  get: mockGet,
  ref: mockRef,
  set: mockSet,
  onValue: mockOnValue,
}));

vi.mock('./db', () => ({ database: {} }));

import {
  loadActivityCategories,
  saveActivityCategories,
  subscribeToActivityCategories,
} from './activity-categories';

const makeSnap = (exists: boolean, val?: unknown) => ({
  exists: () => exists,
  val: () => val,
});

const sampleCategories = [
  { id: '1', icon: 'bike', name: 'Cycling', color: 'green' },
  { id: '2', icon: 'dumbbell', name: 'Gym', color: 'blue' },
];

describe('activity-categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadActivityCategories', () => {
    it('returns categories when items is an array', async () => {
      mockGet.mockResolvedValue(
        makeSnap(true, { _initialized: true, items: sampleCategories }),
      );
      const result = await loadActivityCategories('uid-1');

      expect(result).toEqual(sampleCategories);
    });

    it('normalises object items to array (Firebase sparse array)', async () => {
      const objectItems = { 0: sampleCategories[0], 1: sampleCategories[1] };
      mockGet.mockResolvedValue(
        makeSnap(true, { _initialized: true, items: objectItems }),
      );
      const result = await loadActivityCategories('uid-1');

      expect(result).toEqual(sampleCategories);
    });

    it('returns empty array when items is null (user cleared list)', async () => {
      mockGet.mockResolvedValue(
        makeSnap(true, { _initialized: true, items: null }),
      );
      const result = await loadActivityCategories('uid-1');

      expect(result).toEqual([]);
    });

    it('returns null when no data exists (not yet initialised)', async () => {
      mockGet.mockResolvedValue(makeSnap(false));
      const result = await loadActivityCategories('uid-1');

      expect(result).toBeNull();
    });
  });

  describe('saveActivityCategories', () => {
    it('saves with _initialized flag and items', async () => {
      await saveActivityCategories('uid-1', sampleCategories);

      expect(mockSet).toHaveBeenCalledWith(
        { _path: 'users/uid-1/activityCategories' },
        { _initialized: true, items: sampleCategories },
      );
    });

    it('saves items as null when categories array is empty', async () => {
      await saveActivityCategories('uid-1', []);

      expect(mockSet).toHaveBeenCalledWith(
        { _path: 'users/uid-1/activityCategories' },
        { _initialized: true, items: null },
      );
    });
  });

  describe('subscribeToActivityCategories', () => {
    it('calls callback with categories from snapshot', () => {
      mockOnValue.mockImplementation(
        (_ref: unknown, cb: (snap: unknown) => void) => {
          cb(makeSnap(true, { _initialized: true, items: sampleCategories }));

          return vi.fn();
        },
      );

      const callback = vi.fn();
      subscribeToActivityCategories('uid-1', callback, []);

      expect(callback).toHaveBeenCalledWith(sampleCategories);
    });

    it('seeds default categories when snapshot does not exist', () => {
      mockOnValue.mockImplementation(
        (_ref: unknown, cb: (snap: unknown) => void) => {
          cb(makeSnap(false));

          return vi.fn();
        },
      );

      const defaults = [
        { id: 'd1', icon: 'run', name: 'Running', color: 'red' },
      ];
      subscribeToActivityCategories('uid-1', vi.fn(), defaults);

      expect(mockSet).toHaveBeenCalledWith(
        { _path: 'users/uid-1/activityCategories' },
        { _initialized: true, items: defaults },
      );
    });
  });
});
