---
applyTo: 'src/firebase/**'
description: 'Use when working on Firebase database operations, refs, subscriptions, or data type conversions (IRow ↔ IRowData).'
---

# Firebase Data Layer

## File Structure

```
firebase/
  config.ts              # Firebase app initialization
  db.ts                  # Shared database instance (getDatabase)
  database.ts            # Barrel — re-exports all domain modules
  types.ts               # Shared Firebase data interfaces (IRowData, ICalendarEntry, etc.)
  settings.ts            # User settings & preferences CRUD
  diary.ts               # User diary data (IRowData) CRUD
  calendar.ts            # Calendar entries, notes, trainer calendar
  activity-categories.ts # Activity categories CRUD + subscription + auto-seeding
  messages.ts            # Chat messages CRUD + subscription
  message-limits.ts      # Daily AI message limits & rate checking
  trainer.ts             # Trainer connections, invites, accept/disconnect
  training-sessions.ts   # Training session CRUD, packages, payment status
  user-directory.ts      # User directory, display name, avatar, trainer flag
  user-management.ts     # Bulk operations (deleteAll, importAll, loadAll)
  admin.ts               # Admin limit management & usage stats
```

New operations go in the appropriate domain module. The `database.ts` barrel re-exports everything, so consumers import from `@firebase-config/database` unchanged.

## Ref Helpers

All database paths go through `get*Ref()` functions. Path pattern: `users/{userId}/{section}`.

```ts
export const getUserSettingsRef = (userId: string) =>
  ref(database, `users/${userId}/settings`);
```

## CRUD Naming

| Operation | Prefix       | Example                                                               |
| --------- | ------------ | --------------------------------------------------------------------- |
| Read once | `load*`      | `loadUserSettings(userId)`                                            |
| Write     | `save*`      | `saveUserSettings(userId, settings)`                                  |
| Realtime  | `subscribe*` | `subscribeToCalendarEntries(userId, cb)` — returns unsubscribe fn     |
| Create    | `create*`    | `createCalendarEntry(userId, date, data)` — uses `push()` for auto-ID |
| Delete    | `delete*`    | `deleteCalendarEntry(userId, date, entryId)`                          |
| Update    | `update*`    | `updateCalendarEntryNote(userId, date, entryId, note)`                |

## Type Conversion

Client uses `Date` objects (`IRow`); Firebase stores ISO date strings (`IRowData`). Convert at the boundary — never store `Date` objects in Firebase.

```ts
// Client → Firebase: toLocalDateString(date) → 'YYYY-MM-DD'
// Firebase → Client: new Date(`${dateStr}T00:00:00`) — local timezone
```

Always convert dates in **local timezone** to avoid UTC date shifts.

## Subscriptions

Return an unsubscribe function. Caller is responsible for cleanup (typically in `useEffect` return).

```ts
export const subscribeToCalendarEntries = (
  userId: string,
  callback: (data: CalendarEntries | null) => void,
): (() => void) => {
  const entriesRef = getUserCalendarEntriesRef(userId);
  const unsubscribe = onValue(entriesRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });

  return unsubscribe;
};
```

## Calendar Entries

- Nested by date: `calendarEntries/{date}/{entryId}`
- Use `push()` for auto-generated entry IDs
- `CalendarEntry` has `type: 'activity' | 'custom'` — activity entries reference an `activityId`, custom entries carry inline `name`/`icon`/`color`

## Activity Categories

Stored as `{ _initialized: true, items: ActivityCategory[] | null }` — the `_initialized` flag prevents re-seeding defaults after the user intentionally empties the list.
