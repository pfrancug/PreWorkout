// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockVerifyFirebaseToken = vi.fn();
const mockStreamText = vi.fn();

vi.mock('../lib/verify-token.js', () => ({
  verifyFirebaseToken: (...args: unknown[]) => mockVerifyFirebaseToken(...args),
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

const makeReq = (
  overrides: {
    method?: string;
    authorization?: string;
    body?: Record<string, unknown>;
  } = {},
) =>
  new Request('http://localhost/api/ai/grok', {
    method: overrides.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: overrides.authorization ?? 'Bearer valid-token',
    },
    body:
      overrides.method === 'GET'
        ? undefined
        : JSON.stringify(overrides.body ?? validBody),
  });

const readSSE = async (res: Response): Promise<string[]> => {
  const text = await res.text();
  const events: string[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('data: ')) {
      events.push(trimmed);
    }
  }

  return events;
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
    mockVerifyFirebaseToken.mockResolvedValue('user-1');
    mockStreamText.mockReturnValue(makeStream(['Hello', ' world']));
    process.env.XAI_API_KEY = 'test-key';
  });

  it('returns 405 for non-POST methods', async () => {
    const res = await handler(makeReq({ method: 'GET' }));

    expect(res.status).toBe(405);
  });

  it('returns 401 for missing/invalid token', async () => {
    mockVerifyFirebaseToken.mockResolvedValue(null);
    const res = await handler(makeReq());

    expect(res.status).toBe(401);
  });

  it('returns 400 for missing userMessage', async () => {
    const res = await handler(
      makeReq({
        body: { systemInstruction: 'test', messages: [], userMessage: '' },
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 413 for payload exceeding 100KB', async () => {
    const res = await handler(
      makeReq({
        body: {
          systemInstruction: 'x'.repeat(100_001),
          messages: [],
          userMessage: 'hi',
        },
      }),
    );

    expect(res.status).toBe(413);
  });

  it('streams SSE response and ends with [DONE]', async () => {
    const res = await handler(makeReq());

    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const events = await readSSE(res);

    expect(events).toContain(`data: ${JSON.stringify({ text: 'Hello' })}`);
    expect(events[events.length - 1]).toBe('data: [DONE]');
  });

  it('returns 500 when XAI_API_KEY is not set', async () => {
    delete process.env.XAI_API_KEY;
    const res = await handler(makeReq());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Grok API key not configured' });
  });

  it('writes error as SSE event during streaming', async () => {
    mockStreamText.mockReturnValue({
      textStream: (async function* () {
        yield 'partial';
        throw new Error('Stream broke');
      })(),
    });

    const res = await handler(makeReq());
    const events = await readSSE(res);

    const errorEvent = events.find((e) => e.includes('"error"'));
    expect(errorEvent).toBeDefined();
  });

  it('passes messages with system instruction to streamText', async () => {
    await handler(makeReq());

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
