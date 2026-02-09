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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Gemini API key not configured' });
    return;
  }

  const config = req.body as AIConfig;
  if (!config?.userMessage || !config?.systemInstruction) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
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

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: config.systemInstruction }],
          },
          contents,
        }),
      },
    );

    if (!upstream.ok) {
      const err = await upstream.json();
      const message =
        err.error?.message || `Gemini API error: ${upstream.status}`;
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

          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          } catch {
            // Skip invalid JSON chunks
          }
        }
      }
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
