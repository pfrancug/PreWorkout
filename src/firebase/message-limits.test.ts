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
  loadChatLimitStatus,
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
    it('returns false when count is under the limit (limited mode)', async () => {
      setupMocks(true, { mode: 'limited' }, true, 10);
      const result = await isMessageLimitReached('uid-1');

      expect(result).toBe(false);
    });

    it('returns true when count reaches the limit (limited mode)', async () => {
      setupMocks(true, { mode: 'limited' }, true, 25);
      const result = await isMessageLimitReached('uid-1');

      expect(result).toBe(true);
    });

    it('returns true when mode is disabled', async () => {
      setupMocks(true, { mode: 'disabled' }, true, 0);
      const result = await isMessageLimitReached('uid-1');

      expect(result).toBe(true);
    });

    it('returns false when mode is unlimited', async () => {
      setupMocks(true, { mode: 'unlimited' }, true, 999);
      const result = await isMessageLimitReached('uid-1');

      expect(result).toBe(false);
    });

    it('defaults to limited when no limits config exists', async () => {
      setupMocks(false, null, true, 24);
      const notReached = await isMessageLimitReached('uid-1');
      expect(notReached).toBe(false);

      setupMocks(false, null, true, 25);
      const reached = await isMessageLimitReached('uid-1');
      expect(reached).toBe(true);
    });
  });

  describe('getRemainingMessages', () => {
    it('returns remaining count for limited mode', async () => {
      setupMocks(true, { mode: 'limited' }, true, 10);
      const remaining = await getRemainingMessages('uid-1');

      expect(remaining).toBe(15);
    });

    it('returns 0 when at or over limit', async () => {
      setupMocks(true, { mode: 'limited' }, true, 30);
      const remaining = await getRemainingMessages('uid-1');

      expect(remaining).toBe(0);
    });

    it('returns Infinity when mode is unlimited', async () => {
      setupMocks(true, { mode: 'unlimited' }, true, 100);
      const remaining = await getRemainingMessages('uid-1');

      expect(remaining).toBe(Infinity);
    });

    it('returns 0 when mode is disabled', async () => {
      setupMocks(true, { mode: 'disabled' }, true, 0);
      const remaining = await getRemainingMessages('uid-1');

      expect(remaining).toBe(0);
    });
  });

  describe('loadMessageLimitConfig', () => {
    it('returns limit config when it exists', async () => {
      mockGet.mockResolvedValue(makeSnap(true, { mode: 'unlimited' }));
      const result = await loadMessageLimitConfig('uid-1');

      expect(result).toEqual({ mode: 'unlimited' });
    });

    it('uses default mode when mode is missing from config', async () => {
      mockGet.mockResolvedValue(makeSnap(true, {}));
      const result = await loadMessageLimitConfig('uid-1');

      expect(result).toEqual({ mode: 'limited' });
    });

    it('returns null when no config exists', async () => {
      mockGet.mockResolvedValue(makeSnap(false));
      const result = await loadMessageLimitConfig('uid-1');

      expect(result).toBeNull();
    });
  });

  describe('loadChatLimitStatus', () => {
    it('returns disabled and 0 remaining for disabled mode', async () => {
      setupMocks(true, { mode: 'disabled' }, true, 0);
      const result = await loadChatLimitStatus('uid-1');

      expect(result).toEqual({ disabled: true, remaining: 0 });
    });

    it('returns not disabled and Infinity for unlimited mode', async () => {
      setupMocks(true, { mode: 'unlimited' }, true, 100);
      const result = await loadChatLimitStatus('uid-1');

      expect(result).toEqual({ disabled: false, remaining: Infinity });
    });

    it('returns remaining count for limited mode', async () => {
      setupMocks(true, { mode: 'limited' }, true, 10);
      const result = await loadChatLimitStatus('uid-1');

      expect(result).toEqual({ disabled: false, remaining: 15 });
    });

    it('reads mode only once (single DB read for mode)', async () => {
      setupMocks(true, { mode: 'limited' }, true, 5);
      await loadChatLimitStatus('uid-1');

      const limitsCalls = mockGet.mock.calls.filter(
        (call: { _path?: string }[]) => call[0]._path?.includes('/limits'),
      );
      expect(limitsCalls).toHaveLength(1);
    });
  });
});
