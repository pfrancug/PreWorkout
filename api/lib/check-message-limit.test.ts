// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { checkMessageLimit } from './check-message-limit.js';

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 });
const fail = () => new Response('Forbidden', { status: 403 });

describe('checkMessageLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VITE_FIREBASE_DATABASE_URL = 'https://db.firebaseio.com';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns allowed: false when database URL is missing', async () => {
    delete process.env.VITE_FIREBASE_DATABASE_URL;

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: false });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns allowed: false when mode is disabled', async () => {
    mockFetch.mockResolvedValueOnce(ok('disabled'));

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: false });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns allowed: true when mode is unlimited', async () => {
    mockFetch.mockResolvedValueOnce(ok('unlimited'));

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: true });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns allowed: true when mode is limited and count is below limit', async () => {
    mockFetch.mockResolvedValueOnce(ok('limited'));
    mockFetch.mockResolvedValueOnce(ok(10));

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns allowed: false when mode is limited and count equals limit', async () => {
    mockFetch.mockResolvedValueOnce(ok('limited'));
    mockFetch.mockResolvedValueOnce(ok(25));

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: false });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns allowed: false when mode is limited and count exceeds limit', async () => {
    mockFetch.mockResolvedValueOnce(ok('limited'));
    mockFetch.mockResolvedValueOnce(ok(30));

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: false });
  });

  it('defaults to limited when mode is null (no config)', async () => {
    mockFetch.mockResolvedValueOnce(ok(null));
    mockFetch.mockResolvedValueOnce(ok(5));

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: true });
  });

  it('treats null count as zero', async () => {
    mockFetch.mockResolvedValueOnce(ok('limited'));
    mockFetch.mockResolvedValueOnce(ok(null));

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: true });
  });

  it('returns allowed: false when mode fetch fails', async () => {
    mockFetch.mockResolvedValueOnce(fail());

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: false });
  });

  it('returns allowed: false when count fetch fails', async () => {
    mockFetch.mockResolvedValueOnce(ok('limited'));
    mockFetch.mockResolvedValueOnce(fail());

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: false });
  });

  it('constructs correct Firebase REST URLs', async () => {
    mockFetch.mockResolvedValueOnce(ok('limited'));
    mockFetch.mockResolvedValueOnce(ok(0));

    await checkMessageLimit('user-123', 'my-token');

    const modeUrl = mockFetch.mock.calls[0][0] as string;
    expect(modeUrl).toMatch(
      /^https:\/\/db\.firebaseio\.com\/users\/user-123\/limits\/mode\.json\?auth=my-token$/,
    );

    const countUrl = mockFetch.mock.calls[1][0] as string;
    expect(countUrl).toMatch(
      /^https:\/\/db\.firebaseio\.com\/userDirectory\/user-123\/messageSends\/\d{4}-\d{2}\/\d{2}\.json\?auth=my-token$/,
    );
  });

  it('strips trailing slash from database URL', async () => {
    process.env.VITE_FIREBASE_DATABASE_URL = 'https://db.firebaseio.com/';
    mockFetch.mockResolvedValueOnce(ok('unlimited'));

    await checkMessageLimit('u1', 'tok');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('https://db.firebaseio.com/users/');
  });
});
