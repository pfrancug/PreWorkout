# Testing Roadmap

**Total: 428 unit/component tests (44 files) + 36 E2E tests (6 files) = 464 tests**

## Phase 1 — Setup

- [x] Install Vitest + React Testing Library
- [x] Create `vitest.config.ts` (extend `vite.config.ts` aliases, set `jsdom` environment)
- [x] Create `src/test/setup.ts` (import `@testing-library/jest-dom`)
- [x] Add scripts to `package.json`: `"test"`, `"test:watch"`, `"test:coverage"`
- [x] Configure Firebase Emulator Suite in `firebase.json` (Auth + Realtime Database)
- [x] Install Playwright for E2E: `npm install -D @playwright/test`
- [x] Create `playwright.config.ts`

---

## Phase 2 — Unit Tests (pure functions, no mocks)

### Utilities

- [x] `src/lib/validate-import.ts` — `validateImportData()` (54 tests)
  - Valid complete data object
  - Missing top-level keys (settings, preferences, data, etc.)
  - Invalid settings (wrong types, invalid sex enum, negative age/height)
  - Invalid preferences (wrong language, invalid defaultCalendarView)
  - Invalid messages (wrong role, missing parts)
  - Invalid diary data entries (wrong date format, non-numeric fields)
  - Invalid calendarEntries (bad date keys, wrong type enum, missing activityId)
  - Invalid calendarNotes (non-string values, bad date keys)
  - Invalid activityCategories (missing fields, wrong icon/color types)
  - Invalid trainerCalendar (non-boolean values, bad date keys)
  - Invalid limits (non-number max)
  - Null/undefined/empty inputs
  - Extra/unexpected fields (should still pass)

- [x] `src/lib/data-format.ts` — `fromFirebaseFormat()` (8 tests)
  - Legacy ISO string format (`2024-01-15T00:00:00.000Z`)
  - New YYYY-MM-DD format
  - Date parsed in local timezone (no UTC shift)
  - Missing `completed` field defaults correctly
  - Null/empty input handling
  - All numeric fields preserved (kcal, protein, carbs, fat, weight)

- [x] `src/lib/utils.ts` — `cn()` (6 tests)
  - Merges multiple class strings
  - Handles conditional classes (falsy values)
  - tailwind-merge deduplication (e.g. `p-2` + `p-4` → `p-4`)

- [ ] `src/lib/image.ts` — `cropToSquareDataUrl()` _(deferred to Phase 3 — needs Canvas/Image mocking)_

### Calculator

- [x] `src/pages/Calculator/utils/calculate.ts` — `calculate()` (11 tests)
  - Male BMR calculation (Mifflin-St Jeor)
  - Female BMR calculation
  - Maintenance = BMR × activity multiplier
  - Deficit tiers (mild, moderate, extreme) subtract correctly
  - Edge cases: minimum activity, maximum weight/height/age

### Constants

- [x] `src/constants/display.ts` — verify character values (4 tests)

### Calendar Helpers

- [x] `src/components/calendar/calendarEventHelpers.tsx` — `getDrawerEntries()` (17 tests)
  - `mapCalendarEvents()` deferred to Phase 4 (JSX + i18n dependencies)

---

## Phase 3 — Unit Tests (mocked dependencies)

### API Helpers (mock `firebase-admin`)

- [x] `api/lib/auth.ts` — `verifyAuthToken()` (6 tests)
- [x] `api/lib/rate-limit.ts` — `checkRateLimit()` (7 tests)

### Firebase Database Functions (mock Firebase RTDB)

- [x] `src/firebase/settings.ts` — save/load user settings & preferences (6 tests)
- [x] `src/firebase/diary.ts` — save/load diary data, date sorting (5 tests)
- [x] `src/firebase/calendar.ts` — CRUD entries, notes, time updates (10 tests)
- [x] `src/firebase/messages.ts` — save/clear/subscribe, undefined cleanup (8 tests)
- [x] `src/firebase/message-limits.ts` — isMessageLimitReached, getRemainingMessages, loadConfig (11 tests)
- [x] `src/firebase/activity-categories.ts` — load (array/object normalisation), save, subscribe + auto-seed (8 tests)
- [x] `src/firebase/admin.ts` — getUserUsageStats aggregation, get/set limits (6 tests)
- [ ] `src/firebase/trainer.ts` — _(deferred — complex multi-step invite flow, better suited for integration/emulator tests)_
- [ ] `src/firebase/training-sessions.ts` — _(deferred — thin CRUD wrappers with minimal logic)_
- [ ] `src/firebase/user-directory.ts` — _(deferred — complex cross-module propagation)_
- [ ] `src/firebase/user-management.ts` — _(deferred — orchestration of many modules)_

### AI Client Functions (mock fetch/SDK)

- [x] `src/lib/ai/gemini.ts` — `isRateLimitError()` (6 tests)
- [ ] `src/lib/ai/gemini.ts` — `streamFromGemini()` _(deferred — module-level env binding makes SSE parsing hard to isolate)_
- [ ] `src/lib/ai/grok.ts` — `streamFromGrok()` _(deferred — same pattern as gemini, no unique pure functions)_

---

## Phase 4 — Component Tests (React Testing Library)

### Data Components

- [x] `EditableCell` — renders value/EM_DASH, weight formatting, cursor classes, edit mode input, Enter saves, Escape reverts, empty→null (9 tests)
- [ ] `DataTable` — _(deferred — heavy TanStack Table + context wiring, better as integration test)_
- [ ] `ReadOnlyDataTable` — _(deferred — similar complexity to DataTable)_
- [ ] `DataTableToolbar` — _(deferred — tightly coupled to table instance)_

### Calendar Components

- [x] `DayView` — date heading, empty state, entries with names/time/note, day note, click handlers, readOnly, trainer toggle, note button states (12 tests)
- [ ] `EventView` — _(deferred — form + Firebase interactions, better as integration test)_
- [ ] `AddView` — _(deferred — complex form with zod + Firebase)_
- [ ] `AddTrainingView` — _(deferred — complex form with Firebase)_
- [x] `NoteView` — textarea, title, save/delete buttons, onNoteChange+onBack callbacks (6 tests)

### Shared Components

- [x] `ActivityIcon` — renders SVG, fallback for unknown ids, className/style passthrough, different SVGs per icon (4 tests)
- [ ] `IconColorPicker` — _(deferred — complex picker with color/icon grid, dialog interactions)_
- [ ] `TodayPanel` — _(deferred — heavy context dependencies: Auth, DataSet, Firebase subscriptions)_
- [ ] `Chat` — _(deferred — streaming state, complex message rendering, API interactions)_
- [x] `Loader` — spinner SVG, animate-spin class, centered layout (3 tests)
- [ ] `IOSInstallPrompt` — _(deferred — browser detection, platform-specific)_
- [ ] `AppSidebar` — _(deferred — routing context, auth context)_
- [ ] `TrainerRoute` — _(deferred — auth context with role checks)_

### Charts

- [ ] `SparkChart` — _(deferred — Recharts rendering, needs SVG assertion approach)_

---

## Phase 5 — Context & Hook Tests

### Context Consumer Hooks

- [x] `useAuth` — throws when used outside AuthProvider (1 test)
- [x] `useSettings` — throws when used outside SettingsProvider (1 test)
- [x] `useDataSet` — throws when used outside DataProvider (1 test)

### Context Providers (mock Firebase, wrap in providers)

- [x] `AuthProvider` — loading state, user/admin/trainer claims, sign-out reset, updateUserDirectory call, unsubscribe on unmount (6 tests)
- [x] `SettingsProvider` — loads settings/preferences from Firebase, default for null user, default for null prefs, saveSettings persists, updatePreference persists, changeLanguage (6 tests)
- [x] `DataProvider` — loads data, loading state for null user, null from Firebase, debounced save, function updater (5 tests)

### Custom Hooks (renderHook with provider wrappers)

- [x] `useMobile` — true below 1024, false at 1024+, updates on matchMedia change, boundary (4 tests)
- [x] `useSwipeToOpenSidebar` — opens on left-edge swipe, ignores outside edge, below threshold, disabled, vertical, removes listeners (6 tests)
- [x] `useTraineeDataSet` — loading state, loads data, no traineeId, null Firebase, reloads on id change, error handling (6 tests)
- [ ] `useCalendarData` — _(deferred — orchestrator with 6 Firebase subscriptions + useAuth + useCalendarHandlers, better as integration/E2E test)_
- [ ] `useCalendarHandlers` — _(deferred — many async Firebase operations with debounced timers, refs, toast notifications)_

---

## Phase 6 — API Endpoint Tests (mocked handler unit tests)

### `POST /api/admin/set-trainer` (10 tests)

- [x] 405 for non-POST methods
- [x] 401 for missing/invalid token
- [x] 403 for non-admin user
- [x] 400 for missing targetUid, non-boolean isTrainer, empty targetUid, targetUid > 128 chars
- [x] 200 sets trainer claim (preserves existing claims)
- [x] 200 removes trainer claim (preserves other claims)
- [x] 500 when Firebase Admin throws

### `POST /api/ai/gemini` (12 tests)

- [x] 405 for non-POST methods
- [x] 401 for missing/invalid token
- [x] 429 when rate limit exceeded
- [x] Skips rate limit when skipRateLimit is true
- [x] 400 for missing userMessage or systemInstruction
- [x] 413 for payload > 100KB
- [x] 500 when GEMINI_API_KEY is not set
- [x] Streams SSE response with chunks and ends with `data: [DONE]\n\n`
- [x] Passes system instruction prepended to messages
- [x] 500 when streamText throws before headers sent
- [x] Writes error as SSE event after headers sent

### `POST /api/ai/grok` (9 tests)

- [x] 405 for non-POST methods
- [x] 401 for missing/invalid token
- [x] 429 when rate limit exceeded
- [x] 400 for missing userMessage
- [x] 413 for payload > 100KB
- [x] 500 when XAI_API_KEY is not set
- [x] Streams SSE response and ends with [DONE]
- [x] Writes error as SSE event after headers sent
- [x] Passes messages with system instruction and temperature to streamText

---

## Phase 7 — Page-Level Tests

- [x] `LoginPage` — renders Google sign-in button, links to privacy/terms, language toggle, error display/dismiss
- [x] `DiaryPage` — renders DataTable with diary data
- [x] `CalendarPage` — renders FullCalendarView with title/description
- [x] `ChatPage` — renders Chat component with page variant
- [x] `MainPage` — renders dashboard title, SparkCharts, TodayPanel
- [ ] `AdminPage` — renders user list with analytics (admin-only content) _(deferred: heavy Firebase deps)_
- [x] `PrivacyPage` / `TermsPage` — renders legal content, section headings, back navigation link

### Settings Pages

- [ ] `ProfileSettingsPage` — form fields, avatar upload, save _(deferred: complex)_
- [ ] `PreferencesSettingsPage` — language toggle, calendar view, sidebar settings _(deferred: heavy context)_
- [ ] `CategoriesSettingsPage` — add/edit/delete activity categories _(deferred: complex CRUD)_
- [ ] `DataSettingsPage` — export/import data, delete account _(deferred: file I/O, re-auth)_

### Trainer Pages

- [ ] `TrainerInvitesPage` — generate invite code, list pending/accepted connections _(deferred: async data)_
- [ ] `TrainerConnectPage` — enter invite code, submit _(deferred: async data)_
- [ ] `TrainerConnectedPage` — shows connected trainer info _(deferred: async data)_
- [ ] `TraineeViewPage` — renders read-only diary table for trainee _(deferred: multi-tab)_
- [ ] `TrainerSessionsPage` — session list, CRUD operations _(deferred: complex)_
- [x] `TrainerSharingPage` — renders title, description, coming soon message

### Calculator

- [x] `CalculatorPage` — form → results flow, renders title/description/equation toggle
- [x] `CalculatorForm` — gender buttons, age/height/weight inputs, activity select, onChange callbacks
- [x] `Results` — displays TDEE, BMR, four calorie plans with deficit info
- [x] `Equation` — toggle open/close, shows male/female BMR formulas

---

## Phase 8 — E2E Tests (Playwright + Firebase Emulator)

### Setup

- [x] Configure Firebase Emulator (Auth + RTDB) in `firebase.json` — already configured (ports 9099, 9000, UI 4000)
- [x] Create Playwright global setup: start emulators + `vercel dev` + `vite dev` — `e2e/global-setup.ts` + `global-teardown.ts`
- [x] Create test fixtures for seeding emulator data — `e2e/fixtures/seed.ts`
- [x] Create helpers for programmatic login (bypass Google popup via emulator custom tokens) — `e2e/auth.ts`
- [x] Add emulator connection to Firebase client SDK — `src/firebase/config.ts`, `auth.ts`, `db.ts` (via `VITE_USE_EMULATORS`)
- [x] Create `.env.test` with emulator-only Firebase config (project `demo-preworkout`)
- [x] Add npm scripts: `test:e2e`, `test:e2e:ui`
- [x] Exclude `e2e/` and `.vercel/` from Vitest config
- [x] Add `e2e/**/*.ts` to `tsconfig.node.json`
- [x] Create smoke test (`e2e/smoke.spec.ts`) — login page loads, unauth redirect, public pages
- **Prerequisite**: Java JDK 11+ required for Firebase Emulator Suite

### Smoke Tests (`e2e/smoke.spec.ts` — 4 tests)

- [x] Login page loads with sign-in button
- [x] Unauthenticated user redirected to login page
- [x] Privacy Policy page renders
- [x] Terms of Service page renders

### Auth Flows (`e2e/auth-flows.spec.ts` — 6 tests)

- [x] Authenticated user reaches the dashboard
- [x] Authenticated user sees sidebar navigation (diary, calendar, calculator)
- [x] User can navigate to diary page
- [x] User can navigate to calendar page
- [x] User can navigate to calculator page
- [x] User can logout via sidebar menu → redirected to login

### Trainee Flows (`e2e/trainee-flows.spec.ts` — 8 tests)

- [x] Diary page shows data table
- [x] Diary page shows seeded data (after reload picks up seed)
- [x] Can add a new diary row
- [x] Calendar page loads with heading
- [x] Calculator shows form pre-filled from settings (age, height)
- [x] Calculator updates results when inputs change
- [x] Profile settings shows user data (name, age, height)
- [x] Can update profile name (save button disables on success)

### Trainer Flows (`e2e/trainer-flows.spec.ts` — 7 tests)

- [x] Trainer sees trainer management links (invites, trainees)
- [x] Regular user does not see trainer links
- [x] Trainer can generate an invite code
- [x] Trainer can delete an invite code (with confirm dialog)
- [x] Trainer sees empty trainees list
- [x] Trainee sees connect form with invite code input
- [x] Invite code generation produces a 6-char code

### Admin Flows (`e2e/admin-flows.spec.ts` — 4 tests)

- [x] Admin can access admin page
- [x] Admin sees users table
- [x] Non-admin is redirected away from admin page
- [x] Admin sees admin role indicator in sidebar menu

### Cross-cutting (`e2e/cross-cutting.spec.ts` — 7 tests)

- [x] Can switch language to Polish (Dashboard → Pulpit)
- [x] Login page respects default English language
- [x] Sidebar collapses on mobile viewport
- [x] Sidebar toggle opens on mobile
- [x] Profile changes persist after page reload
- [x] Breadcrumb shows current page name
- [x] Navigating between pages preserves auth state

---

## Phase 9 — Database Rules Tests (`tests/database-rules.test.ts` — 107 tests)

Runs against Firebase Emulator (auto-skips if emulators not running). Tests all security rules in `database.rules.json`.

### Root access (3 tests)

- [x] Denies unauthenticated read
- [x] Denies unauthenticated write
- [x] Denies authenticated read at root

### users/{uid} node (2 tests)

- [x] Denies reading entire user node
- [x] Denies writing to arbitrary key under user

### userDirectory (12 tests)

- [x] Admin can read entire userDirectory
- [x] Non-admin cannot read entire userDirectory
- [x] User can read/write own entry
- [x] User cannot read/write another user's entry
- [x] Admin can write any user's entry
- [x] Trainer can read connected trainee's displayName
- [x] Trainee can read trainer's displayName
- [x] messageSends is not writable even by owner
- [x] Validates displayName (≤100 chars) and email (≤200 chars)

### users/{uid}/settings (10 tests)

- [x] Owner can read/write own settings
- [x] Other user cannot read/write settings
- [x] Trainer can read (but not write) connected trainee's settings
- [x] Admin can read any user's settings
- [x] Rejects missing required fields, invalid sex value
- [x] Accepts empty sex (unset)

### users/{uid}/preferences (6 tests)

- [x] Owner can read/write valid preferences
- [x] Other user cannot read preferences
- [x] Rejects invalid language, missing required fields
- [x] Accepts optional hideConnectionSection

### users/{uid}/messages (5 tests)

- [x] Owner can write and read messages
- [x] Other user cannot read messages
- [x] Rejects invalid role, text >50000 chars, unexpected fields

### users/{uid}/data (7 tests)

- [x] Owner can read/write valid data entries
- [x] Other user cannot read data
- [x] Trainer can read (but not write) connected trainee's data
- [x] Rejects entry missing required id/date, accepts null optional fields

### users/{uid}/limits (8 tests)

- [x] Owner can read own limits
- [x] Admin can read/write limits and change max
- [x] Owner cannot change existing max value (can write same value)
- [x] Other user cannot access limits
- [x] Rejects max below -1, missing max field

### users/{uid}/calendarNotes (6 tests)

- [x] Owner can read/write calendar notes
- [x] Trainer can read connected trainee's notes
- [x] Rejects invalid date key, note >2000 chars

### users/{uid}/calendarEntries (9 tests)

- [x] Owner can read/write valid entries
- [x] Trainer can read connected trainee's entries
- [x] Rejects mismatched id, invalid type, invalid date key
- [x] Activity type requires activityId, custom type requires name

### users/{uid}/trainerCalendar (7 tests)

- [x] Trainer can write to connected trainee's trainerCalendar
- [x] Owner cannot write (but can delete date entries)
- [x] Owner can read own trainerCalendar
- [x] Other user cannot access trainerCalendar
- [x] Rejects non-boolean value, invalid date key

### users/{uid}/activityCategories (7 tests)

- [x] Owner can read/write own categories
- [x] Trainer can read/write connected trainee's categories
- [x] Other user cannot access categories
- [x] Rejects unexpected keys, missing required fields

### trainerInvites (6 tests)

- [x] Trainer can create/delete invites
- [x] Any authenticated user can read a specific invite
- [x] Non-trainer cannot create an invite
- [x] Unauthenticated user cannot read invite
- [x] Rejects invite missing required fields

### trainerConnections (7 tests)

- [x] Trainer can create a pending connection
- [x] Regular user cannot create a connection
- [x] Trainer/trainee can read own connection
- [x] Unrelated user cannot read a connection
- [x] Rejects connection with invalid status
- [x] Trainer can delete own connection

### trainingSessions (8 tests)

- [x] Trainer can write sessions for their connection
- [x] Trainee/trainer can read sessions for their connection
- [x] Unrelated user cannot read/write sessions
- [x] Rejects invalid status, mismatched connectionId, missing required fields

### users/{uid}/trainerId (4 tests)

- [x] Owner can read own trainerId
- [x] Other user cannot read trainerId
- [x] Admin can delete trainerId
- [x] Admin cannot directly set trainerId due to validation constraints
