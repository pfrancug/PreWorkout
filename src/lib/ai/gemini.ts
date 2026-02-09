import type { AIConfig, StreamCallbacks } from './types';

// In dev mode, use the API key directly (safe on localhost).
// In production, the key is only on the server behind /api/ai/gemini.
const devApiKey = import.meta.env.DEV
  ? (import.meta.env.VITE_GEMINI_API_KEY ?? null)
  : null;

export const isGeminiAvailable = (): boolean => {
  return import.meta.env.DEV ? !!devApiKey : true;
};

// Dev mode: call Gemini SDK directly via dynamic import
const streamDev = async (
  config: AIConfig,
  callbacks: StreamCallbacks,
): Promise<void> => {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: devApiKey! });

  const contents = [
    ...config.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: config.userMessage }] },
  ];

  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    config: { systemInstruction: config.systemInstruction },
    contents,
  });

  let fullText = '';
  for await (const chunk of stream) {
    fullText += chunk.text ?? '';
    callbacks.onChunk(fullText);
  }

  callbacks.onComplete(fullText);
};

// Production: proxy through Vercel serverless function
const streamProd = async (
  config: AIConfig,
  callbacks: StreamCallbacks,
): Promise<void> => {
  const res = await fetch('/api/ai/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Gemini API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((line) => line.trim() !== '');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
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
  return (
    error instanceof Error &&
    (error.message.includes('429') ||
      error.message.includes('Too Many Requests'))
  );
};
