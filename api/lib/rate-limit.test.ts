// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDbRef } = vi.hoisted(() => ({
  mockDbRef: vi.fn(),
}));

vi.mock('./auth.js', () => ({
  adminDb: { ref: mockDbRef },
}));

import { checkRateLimit } from './rate-limit.js';

const makeSnap = (exists: boolean, val?: unknown) => ({
  exists: () => exists,
  val: () => val,
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-15T12:00:00Z'));
    mockDbRef.mockReset();
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
    const mockTransaction = vi.fn().mockResolvedValue(undefined);
    mockDbRef.mockImplementation((path: string) => {
      if (path.includes('/limits')) {
        return {
          get: vi.fn().mockResolvedValue(makeSnap(limitsExists, limitsVal)),
        };
      }

      return {
        get: vi.fn().mockResolvedValue(makeSnap(countExists, countVal)),
        transaction: mockTransaction,
      };
    });

    return { mockTransaction };
  };

  it('allows when count is under the configured limit', async () => {
    const { mockTransaction } = setupMocks(true, { max: 10 }, true, 3);
    const result = await checkRateLimit('user-1');

    expect(result).toEqual({ allowed: true, remaining: 6 });
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it('denies when count has reached the limit', async () => {
    const { mockTransaction } = setupMocks(true, { max: 5 }, true, 5);
    const result = await checkRateLimit('user-1');

    expect(result).toEqual({ allowed: false, remaining: 0 });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('denies when count exceeds the limit', async () => {
    setupMocks(true, { max: 5 }, true, 10);
    const result = await checkRateLimit('user-1');

    expect(result).toEqual({ allowed: false, remaining: 0 });
  });

  it('uses DEFAULT_DAILY_LIMIT (5) when no limits config exists', async () => {
    setupMocks(false, null, true, 2);
    const result = await checkRateLimit('user-1');

    expect(result).toEqual({ allowed: true, remaining: 2 });
  });

  it('allows unlimited when max is -1', async () => {
    const { mockTransaction } = setupMocks(true, { max: -1 }, true, 999);
    const result = await checkRateLimit('user-1');

    expect(result).toEqual({ allowed: true, remaining: Infinity });
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it('treats count as 0 when no count record exists', async () => {
    setupMocks(true, { max: 5 }, false, null);
    const result = await checkRateLimit('user-1');

    expect(result).toEqual({ allowed: true, remaining: 4 });
  });

  it('uses correct database paths', async () => {
    setupMocks(true, { max: 10 }, true, 0);
    await checkRateLimit('uid-abc');

    expect(mockDbRef).toHaveBeenCalledWith(
      'userDirectory/uid-abc/messageSends/2025-03/15',
    );
    expect(mockDbRef).toHaveBeenCalledWith('users/uid-abc/limits');
  });
});
