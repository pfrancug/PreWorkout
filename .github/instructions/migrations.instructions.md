---
applyTo: 'migrations/**'
description: 'Use when creating or modifying Firebase database migration scripts. Covers naming, structure, credentials, and JSDoc pattern.'
---

# Migration Scripts

## Naming

Files are numbered sequentially: `NNN-short-description.ts` (e.g. `006-remove-trainer-calendar.ts`). Check the highest existing number before creating a new one.

## JSDoc Header

Every migration must start with this pattern:

```ts
/**
 * Migration: One-line description of what this migration does.
 *
 * 1. Step one
 * 2. Step two
 *
 * Usage:
 *   npx tsx migrations/NNN-name.ts [--dry-run]
 *
 * Prerequisites:
 *   - secrets/google-credentials.json (service account key)
 *   - .env with VITE_FIREBASE_DATABASE_URL
 */
```

## Firebase Init Pattern

Use `firebase-admin` with credentials read from `secrets/google-credentials.json` and database URL parsed from `.env`. Do **not** use `dotenv` — read the file directly with `fs`.

```ts
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { cert, type ServiceAccount } from 'firebase-admin/app';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const projectRoot = resolve(import.meta.dirname, '..');
const credentialsPath = resolve(
  projectRoot,
  'secrets',
  'google-credentials.json',
);
const envPath = resolve(projectRoot, '.env');

const envFile = readFileSync(envPath, 'utf-8');
const dbUrlMatch = envFile.match(/VITE_FIREBASE_DATABASE_URL=(.+)/);
const databaseURL = dbUrlMatch?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const serviceAccount = JSON.parse(
  readFileSync(credentialsPath, 'utf-8'),
) as ServiceAccount;

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL,
});
const db = getDatabase(app);
```

## Dry Run Support

Support `--dry-run` flag via `process.argv.includes('--dry-run')`. When active, log what would change but write nothing.

## Execution

```bash
npx tsx migrations/NNN-name.ts           # execute
npx tsx migrations/NNN-name.ts --dry-run # preview changes
```

## Rules

- **One migration per file** — each migration is a standalone script
- **Idempotent when possible** — safe to run multiple times (skip already-migrated data)
- **Log progress** — print per-user actions and a summary at the end
- **Arrow functions** — use arrow function style consistent with the rest of the codebase
- **No dotenv** — read `.env` directly with `fs`; dotenv is not a project dependency
