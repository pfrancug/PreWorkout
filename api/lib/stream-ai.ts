import type { VercelResponse } from '@vercel/node';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createXai } from '@ai-sdk/xai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIConfig {
  systemInstruction: string;
  messages: ChatMessage[];
  userMessage: string;
}

type Provider = 'gemini' | 'grok';

const createModel = (provider: Provider) => {
  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return null;
    }

    const google = createGoogleGenerativeAI({ apiKey });

    return google('gemini-2.5-flash');
  }

  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const xai = createXai({ apiKey });

  return xai('grok-4-1-fast-reasoning');
};

const tryStream = async (
  provider: Provider,
  messages: ChatMessage[],
): Promise<{ textStream: AsyncIterable<string> }> => {
  const model = createModel(provider);

  if (!model) {
    throw new Error(`${provider} API key not configured`);
  }

  const result = streamText({
    model,
    messages,
    maxRetries: 0,
    ...(provider === 'grok' && { temperature: 0.7 }),
  });

  return result;
};

/**
 * Stream an AI response with automatic fallback.
 * Tries the primary provider first; if it fails before any data is sent,
 * transparently falls back to the other provider.
 */
export const streamWithFallback = async (
  res: VercelResponse,
  config: AIConfig,
  primary: Provider,
): Promise<void> => {
  const fallback: Provider = primary === 'gemini' ? 'grok' : 'gemini';

  const messages: ChatMessage[] = [
    { role: 'system', content: config.systemInstruction },
    ...config.messages,
    { role: 'user', content: config.userMessage },
  ];

  // Try primary provider
  let result: { textStream: AsyncIterable<string> };

  try {
    result = await tryStream(primary, messages);
  } catch (error) {
    console.error(`${primary} init failed, trying ${fallback}:`, error);

    // Primary failed to initialize — try fallback immediately
    result = await tryStream(fallback, messages);
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let hasWritten = false;

  try {
    for await (const chunk of result.textStream) {
      hasWritten = true;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    // Primary stream failed mid-way — can only fallback if nothing was sent
    if (hasWritten) {
      const message = error instanceof Error ? error.message : 'Stream error';
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();

      return;
    }

    // Nothing was written yet — try fallback
    console.error(`${primary} stream failed, trying ${fallback}:`, error);

    try {
      const fallbackResult = await tryStream(fallback, messages);

      for await (const chunk of fallbackResult.textStream) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (fallbackError) {
      const message =
        fallbackError instanceof Error
          ? fallbackError.message
          : 'Unknown error';

      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: message });
      }
    }
  }
};
