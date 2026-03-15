// @vitest-environment node
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockVerifyAuthToken = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockStreamText = vi.fn();

vi.mock('../lib/auth.js', () => ({
  verifyAuthToken: (...args: unknown[]) => mockVerifyAuthToken(...args),
}));

vi.mock('../lib/rate-limit.js', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

vi.mock('ai', () => ({
  streamText: (...args: unknown[]) => mockStreamText(...args),
}));

vi.mock('@ai-sdk/xai', () => ({
  createXai: () => (model: string) => `xai:${model}`,
}));

import handler from './grok.js';

const validBody = {
  systemInstruction: 'You are a helpful assistant',
  messages: [{ role: 'user', content: 'Hello' }],
  userMessage: 'How are you?',
};

const makeReq = (overrides: Partial<VercelRequest> = {}) =>
  ({
    method: 'POST',
    headers: { authorization: 'Bearer valid-token' },
    body: { ...validBody },
    ...overrides,
  }) as unknown as VercelRequest;

const makeRes = () => {
  const chunks: string[] = [];
  const headers: Record<string, string> = {};
  const res: Record<string, unknown> = {
    _status: 0,
    _json: null,
    _chunks: chunks,
    _headers: headers,
    headersSent: false,
    status: vi.fn().mockImplementation(function (this: typeof res, code) {
      this._status = code;

      return this;
    }),
    json: vi.fn().mockImplementation(function (this: typeof res, data) {
      this._json = data;
    }),
    setHeader: vi.fn().mockImplementation((_key: string, val: string) => {
      headers[_key] = val;
    }),
    write: vi.fn().mockImplementation((chunk: string) => {
      chunks.push(chunk);
    }),
    end: vi.fn(),
  };

  return res as unknown as VercelResponse & {
    _status: number;
    _json: unknown;
    _chunks: string[];
    _headers: Record<string, string>;
  };
};

const makeStream = (chunks: string[]) => ({
  textStream: (async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  })(),
});

describe('POST /api/ai/grok', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAuthToken.mockResolvedValue('user-1');
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    mockStreamText.mockReturnValue(makeStream(['Hello', ' world']));
    process.env.XAI_API_KEY = 'test-key';
  });

  it('returns 405 for non-POST methods', async () => {
    const res = makeRes();
    await handler(makeReq({ method: 'GET' }), res);

    expect(res._status).toBe(405);
  });

  it('returns 401 for missing/invalid token', async () => {
    mockVerifyAuthToken.mockResolvedValue(null);
    const res = makeRes();
    await handler(makeReq(), res);

    expect(res._status).toBe(401);
  });

  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const res = makeRes();
    await handler(makeReq(), res);

    expect(res._status).toBe(429);
  });

  it('returns 400 for missing userMessage', async () => {
    const res = makeRes();
    await handler(
      makeReq({
        body: { systemInstruction: 'test', messages: [], userMessage: '' },
      }),
      res,
    );

    expect(res._status).toBe(400);
  });

  it('returns 413 for payload exceeding 100KB', async () => {
    const res = makeRes();
    const largeMessage = 'x'.repeat(100_001);
    await handler(
      makeReq({
        body: {
          systemInstruction: largeMessage,
          messages: [],
          userMessage: 'hi',
        },
      }),
      res,
    );

    expect(res._status).toBe(413);
  });

  it('streams SSE response and ends with [DONE]', async () => {
    const res = makeRes();
    await handler(makeReq(), res);

    expect(res._headers['Content-Type']).toBe('text/event-stream');
    expect(res._chunks).toContain(
      `data: ${JSON.stringify({ text: 'Hello' })}\n\n`,
    );
    expect(res._chunks[res._chunks.length - 1]).toBe('data: [DONE]\n\n');
  });

  it('returns 500 when XAI_API_KEY is not set', async () => {
    delete process.env.XAI_API_KEY;
    const res = makeRes();
    await handler(makeReq(), res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Grok API key not configured' });
  });

  it('writes error as SSE event after headers sent', async () => {
    mockStreamText.mockReturnValue({
      textStream: (async function* () {
        yield 'partial';
        throw new Error('Stream broke');
      })(),
    });

    const res = makeRes();
    const origWrite = res.write as ReturnType<typeof vi.fn>;
    origWrite.mockImplementation(function (this: typeof res) {
      (this as unknown as Record<string, unknown>).headersSent = true;
    });

    await handler(makeReq(), res);

    const errorChunk = origWrite.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('"error"'),
    );
    expect(errorChunk).toBeDefined();
    expect(res.end).toHaveBeenCalled();
  });

  it('passes messages with system instruction to streamText', async () => {
    const res = makeRes();
    await handler(makeReq(), res);

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
          { role: 'user', content: 'How are you?' },
        ],
        temperature: 0.7,
      }),
    );
  });
});
