import type { VercelRequest, VercelResponse } from '@vercel/node';

import { verifyAuthToken } from '../lib/auth.js';
import { checkRateLimit } from '../lib/rate-limit.js';
import { streamWithFallback } from '../lib/stream-ai.js';
import type { AIConfig } from '../lib/stream-ai.js';

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

  const rateLimit = await checkRateLimit(uid);
  if (!rateLimit.allowed) {
    res.status(429).json({ error: 'Daily message limit reached' });
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

  await streamWithFallback(res, config, 'grok');
};

export default handler;
