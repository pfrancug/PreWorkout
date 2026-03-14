# TODO: Replace Custom Calendar with FullCalendar

Replace the custom `Calendar` component in `CalendarPage.tsx` with [FullCalendar](https://fullcalendar.io).

> **Scope:** Trainee's own calendar only. The trainer's view of trainees (`TraineeViewPage.tsx`) keeps the existing custom `Calendar` component as-is.

---

## Phase 1 — Install FullCalendar

- [x] Install npm packages:
  ```
  @fullcalendar/react
  @fullcalendar/core
  @fullcalendar/daygrid
  @fullcalendar/timegrid
  @fullcalendar/interaction
  ```

---

## Phase 2 — TypeScript Types

- [x] Add to `src/types/types.ts`:
  - `FCEventType = 'activity' | 'trainingSession' | 'trainerDay'`
  - `FullCalendarEventMeta` interface for FullCalendar `extendedProps` (holds `type`, `categoryId`, `category`, `session`)

---

## Phase 3 — Slate Theme CSS

- [x] Create `src/styles/fullcalendar-slate.css`:
  - Override `--fc-*` CSS variables using the app's existing CSS vars (`--border`, `--card`, `--primary`, `--foreground`, `--muted`, etc.)
  - Add `.dark` class overrides for dark mode
  - Target vars: `--fc-border-color`, `--fc-button-bg-color`, `--fc-button-hover-bg-color`, `--fc-today-bg-color`, `--fc-neutral-bg-color`, `--fc-list-event-hover-bg-color`, `--fc-page-bg-color`, `--fc-event-bg-color`, `--fc-event-border-color`, `--fc-event-text-color`
- [x] Import `fullcalendar-slate.css` in `src/main.tsx` after FullCalendar's default CSS imports

---

## Phase 4 — New FullCalendarView Component

- [ ] Create `src/components/FullCalendarView.tsx`:
  - Use the same Firebase subscriptions as the existing `Calendar.tsx`:
    - `subscribeToCalendarData`
    - `subscribeToCalendarNotes`
    - `subscribeToActivityCategories`
    - `subscribeToTrainerCalendar`
    - `subscribeToTrainingSessions`
    - `subscribeToTraineeConnection` (auto-detect connectionId)
  - **Event mapping** — build `EventInput[]` from Firebase data:
    - Activities → all-day events (one per category per day); colored by `ACTIVITY_COLOR_MAP[category.color]`; custom `eventContent` renders `ActivityIcon`
    - Training sessions with `time != null` → timed event `{ start: '${date}T${time}:00' }`
    - Training sessions with `time == null` → all-day event
    - Trainer calendar markers (not already covered by a session) → background all-day events
  - **Notes** → `dayCellContent` prop renders a sticky-note icon indicator when `calendarNotes[dateKey]` exists
  - **Views**:
    - `dayGridMonth` and `timeGridWeek`
    - `initialView` derived from `preferences.defaultCalendarView`: `'month' → 'dayGridMonth'`, `'week' → 'timeGridWeek'`
  - **Interactions**:
    - `dateClick` → open `ActivityNoteModal` for the clicked date
    - `eventClick` on activity event → open `ActivityNoteModal` for that date
    - `eventClick` on training session event → read-only (no modal; show session info or ignore)
    - Trainer session creation is **not** available in the trainee calendar (trainer-panel only)
  - **i18n**: pass FullCalendar locale (`pl` locale from `@fullcalendar/core/locales/pl` for Polish; default for English)

---

## Phase 5 — Activity/Note Modal

- [ ] Create `src/components/ActivityNoteModal.tsx`:
  - Props: `date`, `activities`, `note`, `categories`, `onToggleActivity`, `onNoteChange`, `onClose`
  - Use existing shadcn `Dialog` or `Sheet` component
  - Activity toggle buttons/checkboxes per category (mirror existing dropdown logic)
  - Debounced note textarea (same 500ms debounce + `saveCalendarNote` as current `Calendar.tsx`)
  - "Manage activities" link navigating to `/settings/categories`

---

## Phase 6 — Wire into Page

- [ ] Update `src/pages/CalendarPage.tsx`: replace `<Calendar />` import and usage with `<FullCalendarView />`
- [ ] `src/components/Calendar.tsx` — **no changes** (still used by trainer view in `TraineeViewPage.tsx`)

---

## Phase 7 — i18n

- [ ] Add any new modal translation keys to `src/i18n/locales/en/calendar.json` and `src/i18n/locales/pl/calendar.json` (e.g. `calendar.editDay`, `calendar.close`)
- [ ] FullCalendar's own locale files handle toolbar labels (Today, Month, Week) — no manual overrides needed for those

---

## No Changes Required

| Area                                      | Reason                                                 |
| ----------------------------------------- | ------------------------------------------------------ |
| `src/firebase/database.ts`                | Data read/write paths are identical                    |
| `database.rules.json`                     | Same Firebase paths; no new nodes                      |
| `src/types/types.ts` → `ITrainingSession` | Already has `time: string \| null` (HH:mm)             |
| `migrations/`                             | Data format unchanged; purely a UI layer replacement   |
| `src/components/Calendar.tsx`             | Kept for trainer's trainee view                        |
| `src/contexts/SettingsContext.tsx`        | `defaultCalendarView: 'month' \| 'week'` maps directly |

---

## Verification Checklist

- [ ] `npm run typecheck` passes with no new errors
- [ ] `npm run build` succeeds
- [ ] Month view shows activity icons in correct day cells with Slate styling
- [ ] Week/time-grid view shows training sessions at their exact `time` slot
- [ ] Clicking a day opens the modal; toggling activities saves to Firebase
- [ ] Notes save with 500ms debounce (same behaviour as before)
- [ ] Trainer view (`/trainer/{traineeId}`) is unaffected — uses original `Calendar`
- [ ] Language switching (en ↔ pl) updates FullCalendar's toolbar labels
- [ ] `defaultCalendarView = 'week'` opens in `timeGridWeek` on load
- [ ] Dark mode Slate theme renders correctly
