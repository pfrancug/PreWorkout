import type { AIConfig, StreamCallbacks } from './types';

import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY ?? null;

if (!apiKey) {
  console.warn('VITE_GEMINI_API_KEY is not set');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const isGeminiAvailable = (): boolean => !!ai;

export const streamFromGemini = async (
  config: AIConfig,
  callbacks: StreamCallbacks,
): Promise<void> => {
  if (!ai) {
    throw new Error('Gemini API key is not configured');
  }

  const contents = [
    ...config.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [{ text: config.userMessage }],
    },
  ];

  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: config.systemInstruction,
    },
    contents,
  });

  let fullText = '';
  for await (const chunk of stream) {
    fullText += chunk.text ?? '';
    callbacks.onChunk(fullText);
  }

  callbacks.onComplete(fullText);
};

export const isRateLimitError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.message.includes('429') ||
      error.message.includes('Too Many Requests'))
  );
};
