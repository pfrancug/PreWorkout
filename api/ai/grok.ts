import { streamText } from 'ai';
import { createXai } from '@ai-sdk/xai';

import { checkMessageLimit } from '../lib/check-message-limit.js';
import { verifyFirebaseToken } from '../lib/verify-token.js';

export const config = { runtime: 'edge' };

interface IChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  systemInstruction: string;
  messages: IChatMessage[];
  userMessage: string;
}

const jsonResponse = (data: Record<string, string>, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('authorization');
  const uid = await verifyFirebaseToken(authHeader);
  if (!uid) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: 'Malformed JSON' }, 400);
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'Grok API key not configured' }, 500);
  }

  if (!body.userMessage || !body.systemInstruction) {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const payloadSize = JSON.stringify(body).length;
  if (payloadSize > 100_000) {
    return jsonResponse({ error: 'Payload too large' }, 413);
  }

  const idToken = authHeader!.slice(7);
  const { allowed } = await checkMessageLimit(uid, idToken);
  if (!allowed) {
    return jsonResponse({ error: 'Daily message limit reached' }, 429);
  }

  const messages: IChatMessage[] = [
    { role: 'system', content: body.systemInstruction },
    ...body.messages,
    { role: 'user', content: body.userMessage },
  ];

  try {
    const xai = createXai({ apiKey });

    const result = streamText({
      model: xai('grok-4-1-fast-reasoning'),
      messages,
      temperature: 0.7,
      maxRetries: 0,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`),
            );
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Unknown error occurred';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return jsonResponse({ error: message }, 500);
  }
};

export default handler;
