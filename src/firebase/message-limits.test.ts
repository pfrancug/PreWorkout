import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockRef } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockRef: vi.fn((_db: unknown, path?: string) => ({ _path: path })),
}));

vi.mock('firebase/database', () => ({
  get: mockGet,
  ref: mockRef,
}));

vi.mock('./db', () => ({ database: {} }));

import {
  getRemainingMessages,
  isMessageLimitReached,
  loadMessageLimitConfig,
} from './message-limits';

const makeSnap = (exists: boolean, val?: unknown) => ({
  exists: () => exists,
  val: () => val,
});

describe('message-limits', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-15T12:00:00Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setupMocks = (
    limitsExists: boolean,
    limitsVal: unknown,
    countExists: boolean,
    countVal: unknown,
  ) => {
    mockGet.mockImplementation((refObj: { _path?: string }) => {
      if (refObj._path?.includes('/limits')) {
        return Promise.resolve(makeSnap(limitsExists, limitsVal));
      }
      if (refObj._path?.includes('/messageSends/')) {
        return Promise.resolve(makeSnap(countExists, countVal));
      }

      return Promise.resolve(makeSnap(false));
    });
  };

  describe('isMessageLimitReached', () => {
    it('returns false when count is under the limit', async () => {
      setupMocks(true, { max: 10 }, true, 5);
      const result = await isMessageLimitReached('uid-1');

      expect(result).toBe(false);
    });

    it('returns true when count reaches the limit', async () => {
      setupMocks(true, { max: 5 }, true, 5);
      const result = await isMessageLimitReached('uid-1');

      expect(result).toBe(true);
    });

    it('returns true when count exceeds the limit', async () => {
      setupMocks(true, { max: 5 }, true, 10);
      const result = await isMessageLimitReached('uid-1');

      expect(result).toBe(true);
    });

    it('returns false when max is -1 (unlimited)', async () => {
      setupMocks(true, { max: -1 }, true, 999);
      const result = await isMessageLimitReached('uid-1');

      expect(result).toBe(false);
    });

    it('uses default limit (5) when no limits config exists', async () => {
      setupMocks(false, null, true, 4);
      const notReached = await isMessageLimitReached('uid-1');
      expect(notReached).toBe(false);

      setupMocks(false, null, true, 5);
      const reached = await isMessageLimitReached('uid-1');
      expect(reached).toBe(true);
    });
  });

  describe('getRemainingMessages', () => {
    it('returns remaining count', async () => {
      setupMocks(true, { max: 10 }, true, 3);
      const remaining = await getRemainingMessages('uid-1');

      expect(remaining).toBe(7);
    });

    it('returns 0 when at or over limit', async () => {
      setupMocks(true, { max: 5 }, true, 8);
      const remaining = await getRemainingMessages('uid-1');

      expect(remaining).toBe(0);
    });

    it('returns Infinity when max is -1', async () => {
      setupMocks(true, { max: -1 }, true, 100);
      const remaining = await getRemainingMessages('uid-1');

      expect(remaining).toBe(Infinity);
    });
  });

  describe('loadMessageLimitConfig', () => {
    it('returns limit config when it exists', async () => {
      mockGet.mockResolvedValue(makeSnap(true, { max: 20 }));
      const result = await loadMessageLimitConfig('uid-1');

      expect(result).toEqual({ max: 20 });
    });

    it('uses default when max is missing from config', async () => {
      mockGet.mockResolvedValue(makeSnap(true, {}));
      const result = await loadMessageLimitConfig('uid-1');

      expect(result).toEqual({ max: 5 });
    });

    it('returns null when no config exists', async () => {
      mockGet.mockResolvedValue(makeSnap(false));
      const result = await loadMessageLimitConfig('uid-1');

      expect(result).toBeNull();
    });
  });
});
