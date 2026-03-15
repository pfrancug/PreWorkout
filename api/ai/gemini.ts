import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

import { verifyAuthToken } from '../lib/auth.js';
import { checkRateLimit } from '../lib/rate-limit.js';

interface IChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  systemInstruction: string;
  messages: IChatMessage[];
  userMessage: string;
  skipRateLimit?: boolean;
}

const handler = async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const uid = await verifyAuthToken(req.headers.authorization);
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = req.body as RequestBody;

  if (!body.skipRateLimit) {
    const rateLimit = await checkRateLimit(uid);
    if (!rateLimit.allowed) {
      res.status(429).json({ error: 'Daily message limit reached' });
      return;
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Gemini API key not configured' });
    return;
  }

  if (!body.userMessage || !body.systemInstruction) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const payloadSize = JSON.stringify(body).length;
  if (payloadSize > 100_000) {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }

  const messages: IChatMessage[] = [
    { role: 'system', content: body.systemInstruction },
    ...body.messages,
    { role: 'user', content: body.userMessage },
  ];

  try {
    const google = createGoogleGenerativeAI({ apiKey });

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages,
      maxRetries: 0,
    });

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
