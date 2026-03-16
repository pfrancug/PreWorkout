// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockVerifyIdToken } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
}));

vi.mock('firebase-admin', () => ({
  default: {
    apps: [{}],
    auth: () => ({ verifyIdToken: mockVerifyIdToken }),
    database: () => ({ ref: vi.fn() }),
    credential: { cert: vi.fn() },
    initializeApp: vi.fn(),
  },
}));

import { verifyAuthToken } from './auth.js';

describe('verifyAuthToken', () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
  });

  it('returns uid for a valid Bearer token', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'user-123' });
    const uid = await verifyAuthToken('Bearer valid-token');

    expect(uid).toBe('user-123');
    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
  });

  it('returns null when authorization header is undefined', async () => {
    const uid = await verifyAuthToken(undefined);

    expect(uid).toBeNull();
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('returns null when header lacks Bearer prefix', async () => {
    const uid = await verifyAuthToken('Basic some-creds');

    expect(uid).toBeNull();
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('returns null for empty string header', async () => {
    const uid = await verifyAuthToken('');

    expect(uid).toBeNull();
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('returns null when token verification fails', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));
    const uid = await verifyAuthToken('Bearer expired-token');

    expect(uid).toBeNull();
  });

  it('extracts the token after "Bearer " prefix', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'u1' });
    await verifyAuthToken('Bearer abc.def.ghi');

    expect(mockVerifyIdToken).toHaveBeenCalledWith('abc.def.ghi');
  });
});
