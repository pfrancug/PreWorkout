import type { AIConfig, StreamCallbacks } from './types';

const apiKey = import.meta.env.VITE_XAI_API_KEY ?? null;

export const isGrokAvailable = (): boolean => !!apiKey;

export const streamFromGrok = async (
  config: AIConfig,
  callbacks: StreamCallbacks,
): Promise<void> => {
  if (!apiKey) {
    throw new Error('Grok API key is not configured');
  }

  const messages = [
    { role: 'system' as const, content: config.systemInstruction },
    ...config.messages,
    { role: 'user' as const, content: config.userMessage },
  ];

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-reasoning',
      messages,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Grok API request failed');
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
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            callbacks.onChunk(fullText);
          }
        } catch {
          // Skip invalid JSON chunks
        }
      }
    }
  }

  callbacks.onComplete(fullText);
};
