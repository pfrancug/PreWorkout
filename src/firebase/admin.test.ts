import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import {
  getUserMaxLimitForAdmin,
  getUserUsageStats,
  setUserMaxLimitForAdmin,
} from './admin';

const makeSnap = (exists: boolean, val?: unknown) => ({
  exists: () => exists,
  val: () => val,
});

describe('admin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-15T12:00:00Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getUserMaxLimitForAdmin', () => {
    it('returns configured max', async () => {
      mockGet.mockResolvedValue(makeSnap(true, { max: 20 }));
      const result = await getUserMaxLimitForAdmin('uid-1');

      expect(result).toBe(20);
    });

    it('returns default (5) when no config exists', async () => {
      mockGet.mockResolvedValue(makeSnap(false));
      const result = await getUserMaxLimitForAdmin('uid-1');

      expect(result).toBe(5);
    });
  });

  describe('setUserMaxLimitForAdmin', () => {
    it('writes limit to the correct path', async () => {
      await setUserMaxLimitForAdmin('uid-1', 50);

      expect(mockRef).toHaveBeenCalledWith({}, 'users/uid-1/limits');
      expect(mockSet).toHaveBeenCalledWith(
        { _path: 'users/uid-1/limits' },
        { max: 50 },
      );
    });
  });

  describe('getUserUsageStats', () => {
    it('returns null when no message sends data exists', async () => {
      mockGet.mockResolvedValue(makeSnap(false));
      const result = await getUserUsageStats('uid-1');

      expect(result).toBeNull();
    });

    it('computes correct stats from sends data', async () => {
      // Frozen at 2025-03-15. 30 days ago = ~2025-02-13.
      const sendsData = {
        '2025-03': { '15': 3, '10': 5 },
        '2025-02': { '20': 2, '01': 4 },
        '2025-01': { '15': 10 },
      };
      mockGet.mockResolvedValue(makeSnap(true, sendsData));
      const result = await getUserUsageStats('uid-1');

      expect(result).not.toBeNull();
      // allTimeTotal = 3 + 5 + 2 + 4 + 10 = 24
      expect(result!.allTimeTotal).toBe(24);
      // todayMessages = 3 (matching 2025-03-15)
      expect(result!.todayMessages).toBe(3);
      // Last 30 days (>= ~2025-02-13):
      //   2025-03-15 (3) ✓, 2025-03-10 (5) ✓, 2025-02-20 (2) ✓
      //   2025-02-01 ✗ (too old), 2025-01-15 ✗ (too old)
      expect(result!.totalMessages).toBe(10);
      // 3 days with messages in the window
      expect(result!.averageDaily).toBeCloseTo(10 / 3);
    });

    it('returns zero averageDaily when no days have messages', async () => {
      // All messages are older than 30 days
      const sendsData = {
        '2024-01': { '01': 5 },
      };
      mockGet.mockResolvedValue(makeSnap(true, sendsData));
      const result = await getUserUsageStats('uid-1');

      expect(result!.totalMessages).toBe(0);
      expect(result!.averageDaily).toBe(0);
      expect(result!.allTimeTotal).toBe(5);
    });
  });
});
