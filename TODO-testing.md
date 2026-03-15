# Testing Roadmap

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

## Phase 6 — API Integration Tests (Vercel serverless)

### Setup

- [ ] Configure test harness that starts `vercel dev --listen 3001` before tests
- [ ] Create helper to mint Firebase ID tokens (via Admin SDK or emulator)
- [ ] Create helper to seed/clear test data in Firebase

### Endpoint Tests

- [ ] `POST /api/admin/set-trainer`
  - 405 for non-POST methods
  - 401 for missing/invalid token
  - 403 for non-admin user
  - 400 for invalid body (missing targetUid, wrong types, uid too long)
  - 200 sets trainer claim (verify via Admin SDK)
  - 200 removes trainer claim
  - Preserves other custom claims

- [ ] `POST /api/ai/gemini`
  - 405 for non-POST methods
  - 401 for missing/invalid token
  - 429 when rate limit exceeded
  - 400 for missing systemInstruction/messages/userMessage
  - 413 for payload > 100KB
  - 200 streams SSE response (`data: ...\n\n` chunks, ends with `data: [DONE]\n\n`)
  - Error mid-stream written as SSE event (not status code)

- [ ] `POST /api/ai/grok`
  - Same test cases as gemini endpoint

---

## Phase 7 — Page-Level Tests

- [ ] `LoginPage` — renders Google sign-in button, links to privacy/terms
- [ ] `DiaryPage` — renders DataTable with diary data
- [ ] `CalendarPage` — renders FullCalendarView, opens day drawer on click
- [ ] `ChatPage` — renders Chat component
- [ ] `MainPage` — renders dashboard/home content
- [ ] `AdminPage` — renders user list with analytics (admin-only content)
- [ ] `PrivacyPage` / `TermsPage` — renders legal content, back navigation with ArrowLeft

### Settings Pages

- [ ] `ProfileSettingsPage` — form fields, avatar upload, save
- [ ] `PreferencesSettingsPage` — language toggle, calendar view, sidebar settings
- [ ] `CategoriesSettingsPage` — add/edit/delete activity categories
- [ ] `DataSettingsPage` — export/import data, delete account

### Trainer Pages

- [ ] `TrainerInvitesPage` — generate invite code, list pending/accepted connections
- [ ] `TrainerConnectPage` — enter invite code, submit
- [ ] `TrainerConnectedPage` — shows connected trainer info
- [ ] `TraineeViewPage` — renders read-only diary table for trainee
- [ ] `TrainerSessionsPage` — session list, CRUD operations
- [ ] `TrainerSharingPage` — sharing settings toggle

### Calculator

- [ ] `CalculatorPage` — form → results flow
- [ ] `CalculatorForm` — zod validation, all field types
- [ ] `Results` — displays BMR, maintenance, deficit tiers with MINUS constant

---

## Phase 8 — E2E Tests (Playwright + Firebase Emulator)

### Setup

- [ ] Configure Firebase Emulator (Auth + RTDB) in `firebase.json`
- [ ] Create Playwright global setup: start emulators + `vercel dev` + `vite dev`
- [ ] Create test fixtures for seeding emulator data
- [ ] Create helpers for programmatic login (bypass Google popup via emulator custom tokens)

### Auth Flows

- [ ] Google login (via emulator custom token) → lands on diary page
- [ ] Unauthenticated user → redirected to login page
- [ ] Logout → redirected to login page, localStorage cleared

### Trainee Flows (regular user)

- [ ] Diary: add row, edit cell, verify persistence after reload
- [ ] Calendar: add activity, set time range, add note, delete entry
- [ ] Settings: change name, change language (verify i18n switch), export/import data
- [ ] Chat: send message, receive streaming AI response
- [ ] Calculator: fill form, see results

### Trainer Flows (two users via emulator)

- [ ] Trainer generates invite code
- [ ] Trainee enters code → connection established
- [ ] Trainer sees trainee in connections list
- [ ] Trainer views trainee diary (read-only)
- [ ] Trainer creates training session for trainee
- [ ] Trainee sees session on calendar
- [ ] Trainer marks session complete/paid
- [ ] Trainer groups sessions as package
- [ ] Trainer disconnects trainee

### Admin Flows

- [ ] Admin sets user as trainer via admin panel
- [ ] Admin adjusts user message limits
- [ ] Non-admin cannot access admin page

### Cross-cutting

- [ ] Mobile responsive: sidebar collapses, swipe-to-open works
- [ ] i18n: switch EN↔PL, all visible text changes
- [ ] PWA: iOS install prompt appears on Safari (mock user agent)
- [ ] Data persistence: changes survive page reload
- [ ] Error states: network failure, Firebase unavailable

---

## Phase 9 — Database Rules Tests

- [ ] `database.rules.json` — test with Firebase Emulator
  - Unauthenticated read/write → denied
  - User can read/write own `users/{uid}/**` path
  - User cannot read/write another user's `users/{otherUid}/**`
  - Trainer can read trainee data (if connection exists)
  - Admin paths accessible only with admin claim
  - `userDirectory` readable by authenticated users
