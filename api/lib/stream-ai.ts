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

const tryStream = (
  provider: Provider,
  messages: ChatMessage[],
): AsyncIterable<string> => {
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

  return result.textStream;
};

/**
 * Consume a text stream, writing chunks as SSE.
 * Returns the full text (empty string if no chunks received).
 * Throws if the stream errors.
 */
const consumeStream = async (
  stream: AsyncIterable<string>,
  res: VercelResponse,
  headersSet: boolean,
): Promise<{ text: string; headersSet: boolean }> => {
  if (!headersSet) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  }

  let fullText = '';

  for await (const chunk of stream) {
    fullText += chunk;
    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
  }

  return { text: fullText, headersSet: true };
};

/**
 * Stream an AI response with automatic fallback.
 * Tries the primary provider first; if it fails or returns empty
 * before any data is sent, transparently falls back to the other provider.
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

  let headersSet = false;
  let hasData = false;

  // Try primary provider
  try {
    const stream = tryStream(primary, messages);
    const result = await consumeStream(stream, res, headersSet);
    headersSet = result.headersSet;
    hasData = result.text.length > 0;
  } catch (error) {
    console.error(`${primary} failed:`, error);
    // hasData stays false — will try fallback below
  }

  // If primary succeeded with data, finish
  if (hasData) {
    res.write('data: [DONE]\n\n');
    res.end();

    return;
  }

  // Primary returned empty or errored — try fallback
  console.log(`${primary} returned no data, falling back to ${fallback}`);

  try {
    const stream = tryStream(fallback, messages);
    const result = await consumeStream(stream, res, headersSet);
    headersSet = result.headersSet;
    hasData = result.text.length > 0;

    if (hasData) {
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Both providers returned empty
      if (headersSet) {
        res.write(
          `data: ${JSON.stringify({ error: 'No response from AI providers' })}\n\n`,
        );
        res.end();
      } else {
        res.status(500).json({ error: 'No response from AI providers' });
      }
    }
  } catch (fallbackError) {
    const message =
      fallbackError instanceof Error ? fallbackError.message : 'Unknown error';

    if (headersSet) {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: message });
    }
  }
};
