import type { VercelRequest, VercelResponse } from '@vercel/node';

import { GoogleGenAI } from '@google/genai';

import { verifyAuthToken } from '../lib/auth';

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

  const ai = new GoogleGenAI({ apiKey });

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
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: config.systemInstruction,
      },
      contents,
    });

    for await (const chunk of stream) {
      const text = chunk.text ?? '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // If headers already sent, send error as SSE event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: message });
    }
  }
};

export default handler;
