// @vitest-environment node
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockVerifyAuthToken = vi.fn();
const mockGetUser = vi.fn();
const mockSetCustomUserClaims = vi.fn();

vi.mock('../lib/auth.js', () => ({
  verifyAuthToken: (...args: unknown[]) => mockVerifyAuthToken(...args),
  adminAuth: {
    getUser: (...args: unknown[]) => mockGetUser(...args),
    setCustomUserClaims: (...args: unknown[]) =>
      mockSetCustomUserClaims(...args),
  },
}));

import handler from './set-trainer.js';

const makeReq = (overrides: Partial<VercelRequest> = {}) =>
  ({
    method: 'POST',
    headers: { authorization: 'Bearer valid-token' },
    body: { targetUid: 'target-1', isTrainer: true },
    ...overrides,
  }) as unknown as VercelRequest;

const makeRes = () => {
  const res: Partial<VercelResponse> & {
    _status: number;
    _json: unknown;
  } = {
    _status: 0,
    _json: null,
    status: vi.fn().mockImplementation(function (this: typeof res, code) {
      this._status = code;

      return this;
    }),
    json: vi.fn().mockImplementation(function (this: typeof res, data) {
      this._json = data;
    }),
  };

  return res as unknown as VercelResponse & { _status: number; _json: unknown };
};

describe('POST /api/admin/set-trainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAuthToken.mockResolvedValue('admin-uid');
    mockGetUser.mockResolvedValue({ customClaims: { admin: true } });
    mockSetCustomUserClaims.mockResolvedValue(undefined);
  });

  it('returns 405 for non-POST methods', async () => {
    const res = makeRes();
    await handler(makeReq({ method: 'GET' }), res);

    expect(res._status).toBe(405);
    expect(res._json).toEqual({ error: 'Method not allowed' });
  });

  it('returns 401 for missing/invalid token', async () => {
    mockVerifyAuthToken.mockResolvedValue(null);
    const res = makeRes();
    await handler(makeReq(), res);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 for non-admin user', async () => {
    mockGetUser.mockResolvedValue({ customClaims: {} });
    const res = makeRes();
    await handler(makeReq(), res);

    expect(res._status).toBe(403);
    expect(res._json).toEqual({ error: 'Forbidden: admin only' });
  });

  it('returns 400 for missing targetUid', async () => {
    const res = makeRes();
    await handler(makeReq({ body: { isTrainer: true } }), res);

    expect(res._status).toBe(400);
    expect(res._json).toEqual({ error: 'Invalid request body' });
  });

  it('returns 400 for non-boolean isTrainer', async () => {
    const res = makeRes();
    await handler(
      makeReq({ body: { targetUid: 'target-1', isTrainer: 'yes' } }),
      res,
    );

    expect(res._status).toBe(400);
  });

  it('returns 400 for empty targetUid', async () => {
    const res = makeRes();
    await handler(makeReq({ body: { targetUid: '', isTrainer: true } }), res);

    expect(res._status).toBe(400);
  });

  it('returns 400 for targetUid exceeding 128 characters', async () => {
    const res = makeRes();
    await handler(
      makeReq({ body: { targetUid: 'a'.repeat(129), isTrainer: true } }),
      res,
    );

    expect(res._status).toBe(400);
  });

  it('sets trainer claim and preserves existing claims', async () => {
    // First getUser: check caller is admin
    mockGetUser
      .mockResolvedValueOnce({ customClaims: { admin: true } })
      // Second getUser: get target user existing claims
      .mockResolvedValueOnce({ customClaims: { admin: false, role: 'user' } });

    const res = makeRes();
    await handler(makeReq(), res);

    expect(res._status).toBe(200);
    expect(res._json).toEqual({ success: true });
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('target-1', {
      admin: false,
      role: 'user',
      trainer: true,
    });
  });

  it('removes trainer claim and preserves other claims', async () => {
    mockGetUser
      .mockResolvedValueOnce({ customClaims: { admin: true } })
      .mockResolvedValueOnce({
        customClaims: { admin: false, trainer: true, role: 'user' },
      });

    const res = makeRes();
    await handler(
      makeReq({ body: { targetUid: 'target-1', isTrainer: false } }),
      res,
    );

    expect(res._status).toBe(200);
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('target-1', {
      admin: false,
      role: 'user',
    });
  });

  it('returns 500 when Firebase Admin throws', async () => {
    mockGetUser
      .mockResolvedValueOnce({ customClaims: { admin: true } })
      .mockRejectedValueOnce(new Error('Firebase error'));

    const res = makeRes();
    await handler(makeReq(), res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to update trainer claim' });
  });
});
