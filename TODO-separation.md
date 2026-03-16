# Separate Activities from Training Sessions

Activities and training sessions are stored separately in Firebase but heavily coupled at the display layer. This plan cleanly separates them so each concept has its own rendering path while both still appear on the calendar.

## Key Coupling Points

- `getDrawerEntries()` converts `ITrainingSession` into fake `ICalendarEntry` objects (`id: 'trainer-${date}'`, `id: 'session-${id}'`)
- `mapCalendarEvents()` has interleaved logic checking for timed sessions to decide whether to show virtual trainer activities
- `DayView` renders both as a flat `ICalendarEntry[]` list
- `trainerCalendar` boolean flags (`users/{id}/trainerCalendar/{date}`) exist solely to bridge sessions → activities
- Auto-created trainer activity category blurs the boundary

## Todo

- [ ] **Separate calendar event types in types** — Stop converting sessions into fake `ICalendarEntry`. Keep `IFullCalendarEventMeta` discriminated union clean (`entry | trainingSession | note`)
- [ ] **Split `mapCalendarEvents` into 2 mappers** — `mapActivityEvents()` and `mapSessionEvents()`, each self-contained
- [ ] **Split `getDrawerEntries` by type** — Return separate typed lists instead of one `ICalendarEntry[]` with fake session entries
- [ ] **Update `DayView` for separate lists** — Render activities and sessions as visually distinct sections (activities with category icons, sessions with dumbbell + payment status)
- [ ] **Remove virtual trainer-entry conversion** — Delete code that converts `ITrainingSession` → fake `ICalendarEntry` with `id: 'trainer-${date}'` or `id: 'session-${id}'`
- [ ] **Remove `trainerCalendar` bridge flags** — `users/{id}/trainerCalendar/{date}` booleans are redundant since sessions already have their own `date` field
- [ ] **Remove trainer activity category entirely** — Training sessions must NOT appear as an activity category. This means:
  - Delete auto-creation logic in `acceptTrainerInvite()` (`firebase/trainer.ts`) that appends a category with `trainerId`/`systemGenerated`
  - Delete archival logic in `disconnectTrainer()` that finds & archives the trainer category
  - Remove `trainerCategoryForDisplay` prop threading from `FullCalendarView`, `calendarEventHelpers`, `DayView`, calendar types
  - Remove `trainerId` and `systemGenerated` fields from `IActivityCategory` type (`firebase/types.ts`)
  - Remove `trainerId`/`systemGenerated` validation from `activityCategories` rules in `database.rules.json`
  - Clean up all test references to `trainerCategory` / `trainerCategoryForDisplay` in `calendarEventHelpers.test.ts`
  - Migration: delete trainer category entries (items with `trainerId`) from all users' `activityCategories`
- [ ] **Update `AddTrainingView`** — Simplify to just create session (no `toggleTrainerCalendarDay`)
- [ ] **Update `FullCalendarView` for split data** — Remove virtual entry generation; both event types already render separately
- [ ] **Update hooks (`useCalendarData`, etc.)** — Stop fetching `trainerCalendar`; remove `toggleTrainerCalendarDay` from `useCalendarHandlers`
- [ ] **Clean up Firebase rules & paths** — Remove `trainerCalendar` rules from `database.rules.json`
- [ ] **Update tests & i18n** — Fix `calendarEventHelpers.test.ts` for removed virtual entry logic; update translations
- [ ] **Rename `drawer` → `modal` where appropriate** — Components like `getDrawerEntries`, drawer-related props/types, and file names that describe what is actually a modal should be renamed to use `modal` terminology
- [ ] **Migration script** — Clean up DB (details in "DB Cleanup" section below)

## DB Cleanup

Activities (`calendarEntries`) and training sessions (`trainingSessions`) are **already stored separately** — no schema changes needed. The cleanup is about removing bridge/redundant data.

### What to remove

| Path                                                            | Reason                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `users/{uid}/trainerCalendar/*`                                 | Bridge flags are redundant — sessions already have a `date` field                    |
| `users/{uid}/activityCategories/items` entries with `trainerId` | Auto-created trainer categories are no longer needed (sessions render independently) |

### What stays unchanged

| Path                                           | Reason                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `users/{uid}/calendarEntries/{date}/{entryId}` | Activity storage — no changes needed                              |
| `trainingSessions/{connectionId}/{sessionId}`  | Session storage — already separate, already has all needed fields |
| `users/{uid}/calendarNotes/{date}`             | Day notes — unrelated to separation                               |
| `trainerConnections/{connectionId}`            | Connection metadata — unrelated                                   |
| `users/{uid}/trainerId`                        | Trainer relationship — still needed for auth/access rules         |
| `users/{uid}/trainerConnectionId`              | Still needed to look up sessions                                  |

### Rules changes (`database.rules.json`)

1. **Delete** the entire `trainerCalendar` block (lines 153-161):
   ```json
   "trainerCalendar": {
     ".read": "auth.uid == $userId || (trainer && has trainerId)",
     ".write": "trainer can write; owner can only delete",
     "$date": { ".validate": "date + boolean" }
   }
   ```
2. **Remove `trainerId` validation** from `activityCategories/items/$categoryIndex` — drop the `trainerId` and `systemGenerated` optional fields from `.validate`
3. **No changes** to `calendarEntries` or `trainingSessions` rules

### Migration script (`migrations/remove-trainer-calendar.ts`)

The script needs to:

1. **Delete all `trainerCalendar` nodes** — For every user, remove `users/{uid}/trainerCalendar`
2. **Remove trainer categories from `activityCategories`** — For every user, filter out items where `trainerId` is set, or optionally just archive them
3. **Verify sessions are intact** — Sanity check that `trainingSessions` data is untouched

**Important**: The migration should be idempotent (safe to run multiple times) and log what it deletes. Use Firebase Admin SDK with `--project` flag for targeting the correct environment.
