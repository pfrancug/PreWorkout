# Personal Trainer Feature

## Overview

Enable personal trainers to connect with users, supervise their progress (calendar & diary), associate training sessions, and track payment confirmations — all within the existing app.

---

## Roadmap

### Phase 1: Role & Data Model Foundation

- [x] Add `trainer` role to auth system (`isTrainer` context flag, custom claim)
- [x] Create `scripts/set-trainer.ts` CLI script
- [x] Add "Set Trainer" action to Admin Page
- [x] Design & document new database nodes (`trainerConnections`, `trainingPayments`, `users/{uid}/trainerId`)
- [x] Update `database.rules.json` with cross-user read rules for trainers

### Phase 2: Trainer–Trainee Connection Flow

- [x] Implement invite code generation & acceptance in `database.ts`
- [x] Create Trainer Settings Page (`/settings/trainer`)
  - Regular users: enter invite code, view/disconnect current trainer
  - Trainers: generate invite code, manage connected trainees
- [x] Add route and sidebar navigation
- [x] Add EN + PL i18n translations for trainer settings

### Phase 3: Trainer Dashboard & Supervised Views

- [x] Create Trainer Dashboard page (`/trainer/connected`) — list of connected trainees (clickable → trainee view)
- [x] Create Trainee View page (`/trainer/:traineeId`) — tabbed: Calendar | Diary
- [x] Parameterize `Calendar` component with `userId` + `readOnly` props
- [x] Create `ReadOnlyDataTable` + `getReadOnlyColumns` for read-only trainee diary viewing
- [x] Add `useTraineeDataSet` hook variant

### Phase 4: Training Sessions in Calendar

- [ ] Extend calendar data model to flag trainer sessions
- [ ] Auto-flag "Personal Training" activity when trainee has a connected trainer
- [ ] Highlight trainer session days in supervised calendar view
- [ ] Allow trainer to mark days as trainer sessions from their view

### Phase 5: Payment Tracking

- [ ] Implement payment data model & database functions
- [ ] Build Payment Tracker UI component
  - Trainer: "Mark Paid" (instant confirm), "Confirm" (trainee-initiated)
  - Trainee: "Mark Paid" → awaiting trainer confirmation
- [ ] Payment status indicators (red/yellow/green)
- [ ] Monthly summary card (sessions count, paid, unpaid)
- [ ] Badge/notification for pending payment confirmations

### Phase 6: i18n, Polish & Edge Cases

- [ ] Add EN + PL translations for all trainer-related strings
- [ ] Handle trainer/trainee disconnection gracefully
- [ ] Handle account deletion cleanup (both sides)
- [ ] Enforce one-trainer-per-trainee constraint
- [ ] Ensure trainer cannot access AI chat history (privacy)
- [ ] Add loading/empty states for all new pages
- [ ] Create migration script if needed

---

## Database Schema

### New Nodes

```
/trainerConnections/{connectionId}/
  trainerId: string
  traineeId: string
  status: "pending" | "active" | "declined"
  inviteCode: string
  createdAt: number

/users/{userId}/trainerId → string | null

/trainingPayments/{connectionId}/{YYYY-MM}/
  sessions: [
    {
      date: "YYYY-MM-DD"
      markedPaidBy: "trainer" | "trainee"
      confirmedByTrainer: boolean
    }
  ]
```

### Security Rules Summary

| Data                | Trainee                   | Trainer (connected) | Admin      |
| ------------------- | ------------------------- | ------------------- | ---------- |
| Diary (`data`)      | read/write                | **read only**       | read/write |
| Calendar            | read/write                | **read only**       | read/write |
| Calendar Notes      | read/write                | **read only**       | read/write |
| Activity Categories | read/write                | **read only**       | read/write |
| Settings (profile)  | read/write                | **read only**       | read/write |
| AI Chat Messages    | read/write                | **no access**       | read/write |
| Training Payments   | mark paid                 | mark paid + confirm | full       |
| Trainer Connection  | accept/decline/disconnect | create/revoke       | full       |

---

## Payment Flow

```
Trainer marks paid ──────────────────────► ✅ Confirmed (done)

Trainee marks paid ──► ⏳ Pending ──► Trainer confirms ──► ✅ Confirmed
```

---

## Files to Create

| File                                         | Purpose                                |
| -------------------------------------------- | -------------------------------------- |
| `src/pages/TrainerDashboardPage.tsx`         | Trainer's main page — list of trainees |
| `src/pages/TraineeViewPage.tsx`              | Supervised view of a specific trainee  |
| `src/pages/settings/TrainerSettingsPage.tsx` | Connection management                  |
| `src/components/PaymentTracker.tsx`          | Payment status table + actions         |
| `scripts/set-trainer.ts`                     | CLI to grant trainer role              |

## Files to Modify

| File                            | Changes                                                             |
| ------------------------------- | ------------------------------------------------------------------- |
| `src/contexts/AuthContext.tsx`  | Add `isTrainer` to context type                                     |
| `src/contexts/AuthProvider.tsx` | Read `trainer` custom claim                                         |
| `src/firebase/database.ts`      | Connection, payment, cross-user read functions                      |
| `database.rules.json`           | New nodes + cross-user access rules                                 |
| `src/App.tsx`                   | New routes (`/trainer`, `/trainer/:traineeId`, `/settings/trainer`) |
| `src/components/AppSidebar.tsx` | Trainer nav group                                                   |
| `src/components/Calendar.tsx`   | `userId` + `readOnly` props, trainer session flag                   |
| `src/pages/AdminPage.tsx`       | "Set Trainer" button per user                                       |
| `src/types/types.ts`            | `ITrainerConnection`, `IPaymentSession` interfaces                  |
| `src/i18n/locales/en/*.json`    | English translations                                                |
| `src/i18n/locales/pl/*.json`    | Polish translations                                                 |

---

## Implementation Order

| Priority | Phase   | Milestone                                      |
| -------- | ------- | ---------------------------------------------- |
| 1        | Phase 1 | Foundation — roles, schema, rules (no UI)      |
| 2        | Phase 2 | Trainer & trainee can connect                  |
| 3        | Phase 3 | Trainer can view trainee data                  |
| 4        | Phase 4 | Training sessions tied to trainer in calendar  |
| 5        | Phase 5 | Payment confirmation flow                      |
| 6        | Phase 6 | Production-ready (i18n, edge cases, migration) |

---

## Constraints & Decisions

- **One trainer per trainee** (enforced in DB rules)
- **Multiple trainees per trainer** (no limit)
- **Trainer is read-only** — cannot modify trainee's diary or calendar entries
- **No in-app payments** — only confirmation that payment happened externally
- **Trainer cannot see AI chat** — privacy boundary
- **Connection via invite code** — trainer generates, trainee enters
- **Existing "Personal Training" default category** is reused for trainer sessions
