import type { AIConfig, StreamCallbacks } from './types';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

// In dev mode, use the API key directly (safe on localhost).
// In production, the key is only on the server behind /api/ai/gemini.
const devApiKey = import.meta.env.DEV
  ? (import.meta.env.VITE_GEMINI_API_KEY ?? null)
  : null;

export const isGeminiAvailable = (): boolean => {
  return import.meta.env.DEV ? !!devApiKey : true;
};

// Dev mode: call Gemini API directly via AI SDK
const streamDev = async (
  config: AIConfig,
  callbacks: StreamCallbacks,
): Promise<void> => {
  const google = createGoogleGenerativeAI({ apiKey: devApiKey! });

  const messages = [
    { role: 'system' as const, content: config.systemInstruction },
    ...config.messages,
    { role: 'user' as const, content: config.userMessage },
  ];

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages,
  });

  let fullText = '';
  for await (const chunk of result.textStream) {
    fullText += chunk;
    callbacks.onChunk(fullText);
  }

  callbacks.onComplete(fullText);
};

// Production: proxy through Vercel serverless function
const streamProd = async (
  config: AIConfig,
  callbacks: StreamCallbacks,
): Promise<void> => {
  const { authToken, ...body } = config;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch('/api/ai/gemini', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(
      err.error
        ? `${err.error} (${res.status})`
        : `Gemini API error: ${res.status}`,
    );
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            fullText += parsed.text;
            callbacks.onChunk(fullText);
          }
        } catch (e) {
          if (
            e instanceof Error &&
            e.message !== 'Unexpected end of JSON input'
          ) {
            throw e;
          }
        }
      }
    }
  }

  callbacks.onComplete(fullText);
};

export const streamFromGemini = import.meta.env.DEV ? streamDev : streamProd;

export const isRateLimitError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  const msg = error.message.toLowerCase();

  return (
    msg.includes('429') ||
    msg.includes('too many requests') ||
    (msg.includes('resource') && msg.includes('exhausted')) ||
    msg.includes('rate limit')
  );
};
