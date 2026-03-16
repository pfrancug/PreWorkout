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

  it('returns allowed: true when write is accepted', async () => {
    mockFetch.mockResolvedValueOnce(ok(10));
    mockFetch.mockResolvedValueOnce(ok(11));

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns allowed: false when write is rejected by security rules', async () => {
    mockFetch.mockResolvedValueOnce(ok(25));
    mockFetch.mockResolvedValueOnce(fail());
    // retry: re-read, re-write
    mockFetch.mockResolvedValueOnce(ok(25));
    mockFetch.mockResolvedValueOnce(fail());

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: false });
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('retries and succeeds after race condition', async () => {
    // First attempt: read 10, write 11 fails (someone else wrote 11 first)
    mockFetch.mockResolvedValueOnce(ok(10));
    mockFetch.mockResolvedValueOnce(fail());
    // Retry: re-read 11 (updated), write 12 succeeds
    mockFetch.mockResolvedValueOnce(ok(11));
    mockFetch.mockResolvedValueOnce(ok(12));

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: true });
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('returns allowed: false when retry re-read fails', async () => {
    mockFetch.mockResolvedValueOnce(ok(10));
    mockFetch.mockResolvedValueOnce(fail());
    mockFetch.mockResolvedValueOnce(fail());

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: false });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('sends PUT with incremented count', async () => {
    mockFetch.mockResolvedValueOnce(ok(7));
    mockFetch.mockResolvedValueOnce(ok(8));

    await checkMessageLimit('user-123', 'my-token');

    const writeCall = mockFetch.mock.calls[1];
    expect(writeCall[1].method).toBe('PUT');
    expect(writeCall[1].headers).toEqual({
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(writeCall[1].body as string)).toBe(8);
  });

  it('treats null count as zero and writes 1', async () => {
    mockFetch.mockResolvedValueOnce(ok(null));
    mockFetch.mockResolvedValueOnce(ok(1));

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: true });
    expect(JSON.parse(mockFetch.mock.calls[1][1].body as string)).toBe(1);
  });

  it('returns allowed: false when count fetch fails', async () => {
    mockFetch.mockResolvedValueOnce(fail());

    const result = await checkMessageLimit('u1', 'tok');

    expect(result).toEqual({ allowed: false });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('constructs correct Firebase REST URLs', async () => {
    mockFetch.mockResolvedValueOnce(ok(0));
    mockFetch.mockResolvedValueOnce(ok(1));

    await checkMessageLimit('user-123', 'my-token');

    const readUrl = mockFetch.mock.calls[0][0] as string;
    expect(readUrl).toMatch(
      /^https:\/\/db\.firebaseio\.com\/userDirectory\/user-123\/messageSends\/\d{4}-\d{2}\/\d{2}\.json\?auth=my-token$/,
    );

    const writeUrl = mockFetch.mock.calls[1][0] as string;
    expect(writeUrl).toBe(readUrl);
  });

  it('strips trailing slash from database URL', async () => {
    process.env.VITE_FIREBASE_DATABASE_URL = 'https://db.firebaseio.com/';
    mockFetch.mockResolvedValueOnce(ok(0));
    mockFetch.mockResolvedValueOnce(ok(1));

    await checkMessageLimit('u1', 'tok');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('https://db.firebaseio.com/userDirectory/');
  });
});
