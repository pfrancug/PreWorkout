import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText } from 'ai';
import { createXai } from '@ai-sdk/xai';

import { verifyAuthToken } from '../lib/auth.js';
import { checkRateLimit } from '../lib/rate-limit.js';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIConfig {
  systemInstruction: string;
  messages: ChatMessage[];
  userMessage: string;
}

const handler = async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Verify Firebase auth token
  const uid = await verifyAuthToken(req.headers.authorization);
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(uid);
  if (!rateLimit.allowed) {
    res.status(429).json({ error: 'Daily message limit reached' });
    return;
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Grok API key not configured' });
    return;
  }

  const config = req.body as AIConfig;
  if (!config?.userMessage || !config?.systemInstruction) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const payloadSize = JSON.stringify(config).length;
  if (payloadSize > 100_000) {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }

  const messages = [
    { role: 'system' as const, content: config.systemInstruction },
    ...config.messages,
    { role: 'user' as const, content: config.userMessage },
  ];

  try {
    const xai = createXai({ apiKey });

    const result = streamText({
      model: xai('grok-4-1-fast-reasoning'),
      messages,
      temperature: 0.7,
      maxRetries: 0,
    });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of result.textStream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: message });
    }
  }
};

export default handler;
