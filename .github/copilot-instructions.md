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
```

**Do NOT deploy to Vercel** (`npx vercel --prod`) unless explicitly told to. Firebase deploy is OK when needed.

## Architecture

```
src/
  components/     # React components (PascalCase files)
    ui/           # shadcn/ui primitives (New York style, lucide icons)
    DataTable/    # TanStack Table wrappers
    charts/       # Recharts wrappers
  contexts/       # React Context — split: *Context.tsx (def), *Provider.tsx (impl), use*() hooks
  firebase/       # All Firebase operations in database.ts, config in config.ts
  hooks/          # Custom hooks
  pages/          # Route pages, nested folders for settings/ and trainer/
  i18n/           # i18next — en.ts + pl.ts in locales/
  types/          # Shared types in types.ts
  constants/      # App constants (SCREAMING_SNAKE_CASE)
  lib/            # Utilities (cn(), date helpers, validation)
  data/           # TanStack Table column definitions
  styles/         # globals.css (Tailwind), fullcalendar theme
api/              # Vercel serverless functions (proxied via /api in dev)
  lib/            # Shared API helpers (auth, rate-limit)
```

**Provider hierarchy** (top → bottom): BrowserRouter → AuthProvider → SettingsProvider → DataProvider → RightPanelProvider → SidebarProvider

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
- **Types belong in `types/`** — shared interfaces and types go in `src/types/`, grouped by domain (e.g. `types.ts` for core data, additional files like `trainer.ts`, `calendar.ts` when a domain grows). Component-local types used by multiple files must be extracted there
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
- **Firebase DB helpers**: `get*Ref()` for paths, `save*` / `load*` / `subscribe*` for operations — all in `firebase/database.ts`
- **API auth**: Bearer token → `verifyAuthToken()` in serverless functions
- **Date handling**: Convert to `YYYY-MM-DD` in local timezone to avoid UTC shifts
