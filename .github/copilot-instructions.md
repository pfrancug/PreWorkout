# Project Guidelines

Diet/fitness tracking SPA with trainer features, calendar, AI chat, and i18n (en/pl).

## Build and Test

```bash
npm run dev          # Vite dev server (frontend)
npm run dev:api      # Vercel dev server on :3001 (API)
npm run build        # tsc -b + vite build
npm run typecheck    # tsc -b (no emit)
npm run lint         # eslint --fix
npm run format       # prettier --write
npm test             # Vitest — unit/component/rules tests
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright E2E (needs emulators running)
npm run test:e2e:ui  # Playwright E2E with interactive UI
```

E2E tests require Firebase Emulators running (`firebase emulators:start --project demo-preworkout`) and Java JDK 11+.

**Do NOT deploy to Vercel** (`npx vercel --prod`) unless explicitly told to. Firebase deploy is OK when needed.

**Always use `npm run` scripts** instead of invoking tools directly (e.g. `npm run lint` not `npx eslint .`, `npm run typecheck` not `npx tsc`). If no suitable script exists, add one to `package.json` first, then use it.

## Architecture

```
src/
  components/     # React components (PascalCase files)
    ui/           # shadcn/ui primitives (New York style, lucide icons)
    dataTable/    # TanStack Table wrappers
    charts/       # Recharts wrappers
  contexts/       # React Context — split: *Context.tsx (def), *Provider.tsx (impl), use*() hooks (useAuth, useSettings, useDataSet)
  firebase/       # Domain modules (settings, calendar, trainer, etc.) re-exported via database.ts barrel; config in config.ts, shared db instance in db.ts
  hooks/          # Custom hooks (useCalendarData, useCalendarHandlers, useMobile, etc.)
  pages/          # Route pages, nested folders for settings/ and trainer/
  i18n/           # i18next — en.ts + pl.ts in locales/
  types/          # Shared types in types.ts
  constants/      # App constants (SCREAMING_SNAKE_CASE)
  lib/            # Utilities (cn(), date helpers, validation)
  data/           # TanStack Table column definitions
  styles/         # globals.css (Tailwind), fullcalendar theme
api/              # Vercel serverless functions (proxied via /api in dev)
  lib/            # Shared API helpers (auth, rate-limit)
tests/            # Database security rules tests (Vitest + Firebase Emulator)
e2e/              # Playwright E2E tests
  fixtures/       # Test data seeding helpers
  auth.ts         # Auth fixture (emulator user creation + login)
  global-setup.ts # Starts emulators, clears stale data
```

**Provider hierarchy** (top → bottom in `App.tsx`): BrowserRouter → AuthProvider → SettingsProvider → DataProvider. Layout providers (`RightPanelProvider` → `SidebarProvider`) live in `AuthenticatedLayout.tsx`.

**Data flow**: Firebase Realtime Database ↔ Context providers with debounced saves (500ms). Client types use `Date` objects (`IRow`); Firebase types use ISO strings (`IRowData`).

## Code Style

- **TypeScript strict mode** — all strictness flags, no unused locals/params
- **Arrow functions only** (`func-style` eslint rule)
- **Named exports** — prefer `export const` over `export default` (exception: Vercel API handlers require `export default handler`)
- **Imports**: `type` keyword for type-only imports; sorted by simple-import-sort (types → external → internal → relative → side-effects)
- **Named imports only** — never use namespace/wildcard imports (`import { useState }` not `import * as React`)
- **JSX**: Always use curly braces for string props (`{'value'}` not `"value"`); sort props alphabetically (shorthand first)
- **Curly braces required** on all control-flow blocks
- **Blank line before return** statements

## File Organization

- **One component per file** — each React component gets its own `.tsx` file, named after the component
- **Keep files short** — if a file exceeds ~300 lines, split it into smaller modules. Extract sub-components, helpers, constants, and types
- **Types colocated per directory** — every directory with `.tsx`/`.ts` files keeps its own `types.ts` for interfaces and types used by files in that folder (e.g. `src/components/types.ts`, `src/components/calendar/types.ts`, `src/components/DataTable/types.ts`, `src/hooks/types.ts`, `src/pages/trainer/types.ts`). Cross-cutting types shared across multiple directories go in `src/types/` grouped by domain
- **Zod schemas** stay colocated with the form component that uses them (exception to the types rule)
- **Hooks in `hooks/`** — custom hooks go in `src/hooks/`, one hook per file
- **Constants in `constants/`** — app constants go in `src/constants/`, grouped by domain
- **Utilities in `lib/`** — helper functions go in `src/lib/`, grouped by concern (date helpers, validation, formatting)

## Conventions

- **Path aliases**: `@components/*`, `@contexts/*`, `@hooks/*`, `@lib/*`, `@pages/*`, `@firebase-config/*`, `@app-types/*`, `@constants/*`, `@data/*`, `@i18n`, `@styles/*`
- **Naming**: PascalCase components/files, camelCase functions, `I` prefix for data interfaces (`IRow`, `ITrainerConnection`), SCREAMING_SNAKE for constants
- **i18n**: All user-facing strings via `useTranslation()` with dot.notation keys — never hardcode text
- **Forms**: react-hook-form + zod schemas — define schema above the form component, use `zodResolver`
- **UI components**: Use shadcn/ui from `@components/ui/`; style with Tailwind + `cn()` utility
- **Icons**: lucide-react; activity icons via `ICON_MAP` / `ActivityIcon` component
- **Firebase DB helpers**: `get*Ref()` for paths, `save*` / `load*` / `subscribe*` for operations — split into domain modules under `firebase/` (e.g. `calendar.ts`, `trainer.ts`, `settings.ts`) and re-exported via `firebase/database.ts` barrel
- **API auth**: Bearer token → `verifyAuthToken()` in serverless functions
- **Date handling**: Convert to `YYYY-MM-DD` in local timezone to avoid UTC shifts
- **Special characters**: For dashes, bullets, and arrows in JSX/string literals, do not use raw Unicode glyphs — use constants from `@constants/display` and lucide icons instead:
  - `EM_DASH` — empty-value placeholders (table cells, inputs)
  - `EN_DASH` — range separators (time ranges, number ranges)
  - `HYPHEN` — date string delimiters (`split(HYPHEN)`), general separators
  - `MINUS` — negative number display (deficit values)
  - `<Dot>` from lucide-react — bullet separators (instead of `•`)
  - `<ArrowLeft>` from lucide-react — back navigation (instead of `←`)
- **No backward compatibility** — when removing features, do a clean removal (no legacy keys, no deprecated fallbacks) unless explicitly told to preserve backward compatibility

## Testing

- **Validation order**: Always run `npm run typecheck` and `npm run lint` before running tests. Fix any errors before proceeding to test execution
- **Unit tests**: Colocated with source files (`*.test.ts`/`*.test.tsx`). Vitest + React Testing Library + jsdom
- **Database rules tests**: `tests/database-rules.test.ts` — runs against Firebase Emulator via REST API. Auto-skips when emulators are not running
- **E2E tests**: `e2e/*.spec.ts` — Playwright + Firebase Emulators. Uses `e2e/auth.ts` fixture for programmatic login via `loginAsUser()`. Seed data via `e2e/fixtures/seed.ts`
- **Test files import explicitly**: `import { describe, expect, it } from 'vitest'` (vitest globals are enabled but explicit imports preferred)
- **Mock pattern**: Use `vi.mock()` at the top of the file; mock Firebase modules as `@firebase-config/*`
- **No test-only exports**: Don't export functions solely for testing. Test through the public API
- **Emulator config**: `.env.test` configures `VITE_USE_EMULATORS=true` with `demo-preworkout` project. Vite runs with `--mode test` for E2E
