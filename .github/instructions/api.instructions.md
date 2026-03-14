---
applyTo: 'api/**'
description: 'Use when creating or modifying Vercel serverless API endpoints. Covers auth, rate limiting, validation, streaming.'
---

# API Endpoints (Vercel Serverless)

## File Structure

```
api/
  lib/auth.ts        # verifyAuthToken(), Firebase Admin init
  lib/rate-limit.ts  # checkRateLimit() per-user daily limit
  ai/gemini.ts       # Streaming AI endpoint
  admin/set-trainer.ts
```

## Handler Pattern

Every endpoint follows this exact sequence:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuthToken } from '../lib/auth.js'; // .js extension required

const handler = async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  // 1. Method check
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // 2. Auth — always verify Bearer token
  const uid = await verifyAuthToken(req.headers.authorization);
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // 3. (Optional) Role check — admin/trainer claims
  // 4. Request body validation — type + bounds
  // 5. Payload size check for large inputs (100KB max)
  // 6. Business logic
};

export default handler;
```

## Key Rules

- **Arrow functions only** — use `const handler = async (...) => { }` not `async function handler()`
- **`export default handler`** — Vercel requires a default export for the handler; this is the one exception to the named-export preference
- **Import extensions**: Use `.js` in relative imports (`../lib/auth.js`) — required by ES modules in Vercel
- **Auth**: `verifyAuthToken(req.headers.authorization)` returns `uid | null`
- **Rate limit**: `checkRateLimit(uid)` returns `{ allowed, remaining }` — use for user-facing AI endpoints
- **Streaming**: Set `Content-Type: text/event-stream`, write `data: ...\n\n` chunks, end with `data: [DONE]\n\n`
- **Error after headers sent**: If `res.headersSent`, write error as SSE event instead of `res.status().json()`
- **Validate all inputs**: Check types, lengths, and bounds before processing
