# Development Environment Setup

## Prerequisites

- **Node.js** (v24+)
- **npm** (comes with Node.js)
- **Java JDK 11+** (required for Firebase Emulator Suite)

## Initial Setup

```bash
npm install
```

This installs all dependencies **and** sets up Husky git hooks (via the `prepare` script).

## External Tools (one-time install)

These tools require separate installation beyond `npm install`:

| Tool                | Install Command                   | Purpose                            |
| ------------------- | --------------------------------- | ---------------------------------- |
| Playwright browsers | `npx playwright install chromium` | E2E testing (downloads Chromium)   |
| Firebase CLI        | `npm install -g firebase-tools`   | Emulators, deploy, admin scripts   |
| Vercel CLI          | Included in devDependencies       | API dev server (`npm run dev:api`) |

## Firebase Service Account

Required for admin scripts and local API development:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Save as `secrets/google-credentials.json` (git-ignored)

Alternatively, set the `FIREBASE_SERVICE_ACCOUNT` environment variable with the JSON content.

## Environment Variables

Create a `.env` file in the project root (or `.env.local`):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## NPM Scripts

| Script                  | Command                             | Description                     |
| ----------------------- | ----------------------------------- | ------------------------------- |
| `npm run dev`           | `vite`                              | Frontend dev server (`:5173`)   |
| `npm run dev:api`       | `vercel dev --listen 3001`          | API dev server (`:3001`)        |
| `npm run build`         | `tsc -b && vite build`              | Production build                |
| `npm run typecheck`     | `tsc --noEmit -p tsconfig.app.json` | Type checking (no emit)         |
| `npm run lint`          | `eslint . --fix`                    | Lint and auto-fix               |
| `npm run format`        | `prettier --write .`                | Format all files                |
| `npm run test`          | `vitest run`                        | Run unit tests once             |
| `npm run test:watch`    | `vitest`                            | Run tests in watch mode         |
| `npm run test:coverage` | `vitest run --coverage`             | Run tests with coverage         |
| `npm run test:e2e`      | `npx playwright test`               | Run E2E tests (needs emulators) |
| `npm run test:e2e:ui`   | `npx playwright test --ui`          | E2E tests with interactive UI   |
| `npm run preview`       | `vite preview`                      | Preview production build        |

## Admin Scripts

```bash
npx tsx scripts/set-admin.ts <USER_UID>      # Grant admin claim
npx tsx scripts/set-trainer.ts <USER_UID>    # Grant trainer claim
```

Requires `GOOGLE_APPLICATION_CREDENTIALS` env var pointing to a Firebase service account key file.

## Firebase Emulators

```bash
firebase emulators:start --project demo-preworkout
```

Starts local emulators for testing (no live Firebase needed):

| Service           | Port    |
| ----------------- | ------- |
| Auth              | `:9099` |
| Realtime Database | `:9000` |
| Emulator UI       | `:4000` |

E2E tests (`npm run test:e2e`) require emulators to be running. Database rules tests (`npm test`) auto-skip when emulators are not available.

The `.env.test` file configures the app to connect to emulators (`VITE_USE_EMULATORS=true`, project `demo-preworkout`). Playwright's web server starts Vite with `--mode test` to load this config automatically.
