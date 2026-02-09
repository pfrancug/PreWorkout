import type { VercelRequest, VercelResponse } from '@vercel/node';

import { verifyAuthToken } from '../lib/auth.js';

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

  const messages = [
    { role: 'system' as const, content: config.systemInstruction },
    ...config.messages,
    { role: 'user' as const, content: config.userMessage },
  ];

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const upstream = await fetch('https://api.x.ai/v1/chat/completions', {
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

    if (!upstream.ok) {
      const err = await upstream.json();
      const message = err.error?.message || 'Grok API request failed';
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
      return;
    }

    const reader = upstream.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No response body' })}\n\n`);
      res.end();
      return;
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
            }
          } catch {
            // Skip invalid JSON chunks
          }
        }
      }
    }

    // Ensure we send DONE if upstream didn't
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
