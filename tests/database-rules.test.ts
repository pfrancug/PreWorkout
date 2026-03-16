import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// --- Constants ---

const AUTH_URL = 'http://127.0.0.1:9099';
const DB_URL = 'http://127.0.0.1:9000';
const NS = 'demo-preworkout-default-rtdb';
const PROJECT_ID = 'demo-preworkout';
const API_KEY = 'fake-api-key';
const PASSWORD = 'test-password-123';

// --- Helpers ---

interface TestUser {
  uid: string;
  token: string;
}

const createTestUser = async (
  email: string,
  claims?: Record<string, unknown>,
): Promise<TestUser> => {
  const signUpRes = await fetch(
    `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: PASSWORD,
        returnSecureToken: true,
      }),
    },
  );

  if (!signUpRes.ok) {
    throw new Error(`signUp failed: ${await signUpRes.text()}`);
  }

  const { localId: uid } = (await signUpRes.json()) as { localId: string };

  if (claims && Object.keys(claims).length > 0) {
    await fetch(
      `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:update`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer owner',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localId: uid,
          customAttributes: JSON.stringify(claims),
        }),
      },
    );
  }

  const signInRes = await fetch(
    `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: PASSWORD,
        returnSecureToken: true,
      }),
    },
  );

  if (!signInRes.ok) {
    throw new Error(`signIn failed: ${await signInRes.text()}`);
  }

  const { idToken } = (await signInRes.json()) as { idToken: string };

  return { uid, token: idToken };
};

const dbUrl = (path: string, token?: string): string => {
  let url = `${DB_URL}/${path}.json?ns=${NS}`;
  if (token) {
    url += `&auth=${token}`;
  }

  return url;
};

const adminUrl = (path: string): string =>
  `${DB_URL}/${path}.json?ns=${NS}&access_token=owner`;

const dbGet = (path: string, token?: string) => fetch(dbUrl(path, token));

const dbSet = (path: string, data: unknown, token?: string) =>
  fetch(dbUrl(path, token), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

const dbRemove = (path: string, token?: string) =>
  fetch(dbUrl(path, token), { method: 'DELETE' });

const adminSet = (path: string, data: unknown) =>
  fetch(adminUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

const adminRemove = (path: string) =>
  fetch(adminUrl(path), { method: 'DELETE' });

// --- Emulator availability check ---

const emulatorsAvailable = await fetch(AUTH_URL)
  .then(() => true)
  .catch(() => false);

// --- Tests ---

describe.runIf(emulatorsAvailable)('Database Security Rules', () => {
  let userA: TestUser;
  let userB: TestUser;
  let admin: TestUser;
  let trainer: TestUser;
  const connectionId = 'conn-test-1';

  beforeAll(async () => {
    // Clear everything
    await fetch(`${AUTH_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
      method: 'DELETE',
    });
    await adminRemove('');

    // Create test users with different roles
    userA = await createTestUser('usera@test.com');
    userB = await createTestUser('userb@test.com');
    admin = await createTestUser('admin@test.com', { admin: true });
    trainer = await createTestUser('trainer@test.com', { trainer: true });

    // Seed userDirectory entries
    await adminSet(`userDirectory/${userA.uid}`, {
      displayName: 'User A',
      email: 'usera@test.com',
      isTrainer: false,
    });
    await adminSet(`userDirectory/${userB.uid}`, {
      displayName: 'User B',
      email: 'userb@test.com',
      isTrainer: false,
    });
    await adminSet(`userDirectory/${trainer.uid}`, {
      displayName: 'Trainer',
      email: 'trainer@test.com',
      isTrainer: true,
    });

    // Seed trainer connection: trainer → userA
    await adminSet(`trainerConnections/${connectionId}`, {
      trainerId: trainer.uid,
      traineeId: userA.uid,
      status: 'active',
      inviteCode: 'ABC123',
      createdAt: Date.now(),
    });

    // Seed userA as connected to trainer
    await adminSet(`users/${userA.uid}/trainerId`, trainer.uid);
    await adminSet(`users/${userA.uid}/trainerConnectionId`, connectionId);
    await adminSet(`users/${userA.uid}/settings`, {
      name: 'User A',
      age: '30',
      height: '175',
      sex: 'male',
    });
    await adminSet(`users/${userA.uid}/preferences`, {
      sidebarOpen: true,
      chatPanelOpen: false,
      language: 'en',
      defaultCalendarView: 'month',
    });
    await adminSet(`users/${userA.uid}/data`, [
      {
        id: 1,
        date: '2024-01-15',
        weight: 75,
        kcal: 2000,
        protein: 150,
        fat: 70,
        carbs: 200,
        completed: true,
      },
    ]);
    await adminSet(`users/${userA.uid}/limits`, { max: 10 });
    await adminSet(`users/${userA.uid}/calendarNotes`, {
      '2024-01-15': 'Test note',
    });
    await adminSet(`users/${userA.uid}/calendarEntries`, {
      '2024-01-15': {
        entry1: {
          id: 'entry1',
          type: 'custom',
          name: 'Morning Run',
          icon: 'running',
          color: 'blue',
        },
      },
    });
    await adminSet(`users/${userA.uid}/activityCategories`, {
      _initialized: true,
      items: [{ id: 'cat1', icon: 'run', name: 'Running', color: 'blue' }],
    });
  });

  afterAll(async () => {
    await adminRemove('');
    await fetch(`${AUTH_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
      method: 'DELETE',
    });
  });

  // ---- Root access ----

  describe('Root access', () => {
    it('denies unauthenticated read', async () => {
      const res = await dbGet('');
      expect(res.ok).toBe(false);
    });

    it('denies unauthenticated write', async () => {
      const res = await dbSet('test', 'value');
      expect(res.ok).toBe(false);
    });

    it('denies authenticated read at root', async () => {
      const res = await dbGet('', userA.token);
      expect(res.ok).toBe(false);
    });
  });

  // ---- User node ----

  describe('users/{uid} node', () => {
    it('denies reading entire user node', async () => {
      const res = await dbGet(`users/${userA.uid}`, userA.token);
      expect(res.ok).toBe(false);
    });

    it('denies writing to arbitrary key under user', async () => {
      const res = await dbSet(
        `users/${userA.uid}/hackPath`,
        'evil',
        userA.token,
      );
      expect(res.ok).toBe(false);
    });
  });

  // ---- userDirectory ----

  describe('userDirectory', () => {
    it('admin can read entire userDirectory', async () => {
      const res = await dbGet('userDirectory', admin.token);
      expect(res.ok).toBe(true);
    });

    it('non-admin cannot read entire userDirectory', async () => {
      const res = await dbGet('userDirectory', userA.token);
      expect(res.ok).toBe(false);
    });

    it('user can read own entry', async () => {
      const res = await dbGet(`userDirectory/${userA.uid}`, userA.token);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.displayName).toBe('User A');
    });

    it('user can write own entry with valid data', async () => {
      const res = await dbSet(
        `userDirectory/${userA.uid}`,
        {
          displayName: 'User A Updated',
          email: 'usera@test.com',
          isTrainer: false,
        },
        userA.token,
      );
      expect(res.ok).toBe(true);
      // Restore
      await adminSet(`userDirectory/${userA.uid}`, {
        displayName: 'User A',
        email: 'usera@test.com',
        isTrainer: false,
      });
    });

    it("user cannot read another user's entry", async () => {
      const res = await dbGet(`userDirectory/${userB.uid}`, userA.token);
      expect(res.ok).toBe(false);
    });

    it("user cannot write another user's entry", async () => {
      const res = await dbSet(
        `userDirectory/${userB.uid}`,
        { displayName: 'Hacked', email: 'h@test.com', isTrainer: false },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it("admin can write any user's entry", async () => {
      const res = await dbSet(
        `userDirectory/${userB.uid}`,
        {
          displayName: 'User B Admin',
          email: 'userb@test.com',
          isTrainer: false,
        },
        admin.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`userDirectory/${userB.uid}`, {
        displayName: 'User B',
        email: 'userb@test.com',
        isTrainer: false,
      });
    });

    it("trainer can read connected trainee's displayName", async () => {
      const res = await dbGet(
        `userDirectory/${userA.uid}/displayName`,
        trainer.token,
      );
      expect(res.ok).toBe(true);
      expect(await res.json()).toBe('User A');
    });

    it("trainee can read trainer's displayName", async () => {
      const res = await dbGet(
        `userDirectory/${trainer.uid}/displayName`,
        userA.token,
      );
      expect(res.ok).toBe(true);
      expect(await res.json()).toBe('Trainer');
    });

    it('messageSends is not writable even by owner', async () => {
      const res = await dbSet(
        `userDirectory/${userA.uid}/messageSends`,
        5,
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects displayName exceeding 100 characters', async () => {
      const res = await dbSet(
        `userDirectory/${userA.uid}`,
        {
          displayName: 'x'.repeat(101),
          email: 'usera@test.com',
          isTrainer: false,
        },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects email exceeding 200 characters', async () => {
      const res = await dbSet(
        `userDirectory/${userA.uid}`,
        { displayName: 'User A', email: 'x'.repeat(201), isTrainer: false },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });
  });

  // ---- users/{uid}/settings ----

  describe('users/{uid}/settings', () => {
    it('owner can read own settings', async () => {
      const res = await dbGet(`users/${userA.uid}/settings`, userA.token);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.name).toBe('User A');
    });

    it('owner can write valid settings', async () => {
      const res = await dbSet(
        `users/${userA.uid}/settings`,
        { name: 'User A New', age: '31', height: '176', sex: 'male' },
        userA.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/settings`, {
        name: 'User A',
        age: '30',
        height: '175',
        sex: 'male',
      });
    });

    it('other user cannot read settings', async () => {
      const res = await dbGet(`users/${userA.uid}/settings`, userB.token);
      expect(res.ok).toBe(false);
    });

    it('other user cannot write settings', async () => {
      const res = await dbSet(
        `users/${userA.uid}/settings`,
        { name: 'Hacked', age: '99', height: '100', sex: 'male' },
        userB.token,
      );
      expect(res.ok).toBe(false);
    });

    it("trainer can read connected trainee's settings", async () => {
      const res = await dbGet(`users/${userA.uid}/settings`, trainer.token);
      expect(res.ok).toBe(true);
    });

    it("trainer cannot write trainee's settings", async () => {
      const res = await dbSet(
        `users/${userA.uid}/settings`,
        { name: 'Trainer Edit', age: '30', height: '175', sex: 'male' },
        trainer.token,
      );
      expect(res.ok).toBe(false);
    });

    it("admin can read any user's settings", async () => {
      const res = await dbGet(`users/${userA.uid}/settings`, admin.token);
      expect(res.ok).toBe(true);
    });

    it('rejects settings missing required fields', async () => {
      const res = await dbSet(
        `users/${userA.uid}/settings`,
        { name: 'Only Name' },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects settings with invalid sex value', async () => {
      const res = await dbSet(
        `users/${userA.uid}/settings`,
        { name: 'Test', age: '30', height: '175', sex: 'other' },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('accepts settings with empty sex (unset)', async () => {
      const res = await dbSet(
        `users/${userA.uid}/settings`,
        { name: 'User A', age: '30', height: '175', sex: '' },
        userA.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/settings`, {
        name: 'User A',
        age: '30',
        height: '175',
        sex: 'male',
      });
    });
  });

  // ---- users/{uid}/preferences ----

  describe('users/{uid}/preferences', () => {
    it('owner can read own preferences', async () => {
      const res = await dbGet(`users/${userA.uid}/preferences`, userA.token);
      expect(res.ok).toBe(true);
    });

    it('owner can write valid preferences', async () => {
      const res = await dbSet(
        `users/${userA.uid}/preferences`,
        {
          sidebarOpen: false,
          chatPanelOpen: true,
          language: 'pl',
          defaultCalendarView: 'week',
        },
        userA.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/preferences`, {
        sidebarOpen: true,
        chatPanelOpen: false,
        language: 'en',
        defaultCalendarView: 'month',
      });
    });

    it('other user cannot read preferences', async () => {
      const res = await dbGet(`users/${userA.uid}/preferences`, userB.token);
      expect(res.ok).toBe(false);
    });

    it('rejects invalid language value', async () => {
      const res = await dbSet(
        `users/${userA.uid}/preferences`,
        {
          sidebarOpen: true,
          chatPanelOpen: false,
          language: 'de',
          defaultCalendarView: 'month',
        },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects missing required fields', async () => {
      const res = await dbSet(
        `users/${userA.uid}/preferences`,
        { language: 'en' },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('accepts optional hideConnectionSection field', async () => {
      const res = await dbSet(
        `users/${userA.uid}/preferences`,
        {
          sidebarOpen: true,
          chatPanelOpen: false,
          language: 'en',
          defaultCalendarView: 'month',
          hideConnectionSection: true,
        },
        userA.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/preferences`, {
        sidebarOpen: true,
        chatPanelOpen: false,
        language: 'en',
        defaultCalendarView: 'month',
      });
    });
  });

  // ---- users/{uid}/messages ----

  describe('users/{uid}/messages', () => {
    it('owner can write and read messages', async () => {
      const messages = [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hi there' }] },
      ];
      const writeRes = await dbSet(
        `users/${userA.uid}/messages`,
        messages,
        userA.token,
      );
      expect(writeRes.ok).toBe(true);

      const readRes = await dbGet(`users/${userA.uid}/messages`, userA.token);
      expect(readRes.ok).toBe(true);
      await adminRemove(`users/${userA.uid}/messages`);
    });

    it('other user cannot read messages', async () => {
      const res = await dbGet(`users/${userA.uid}/messages`, userB.token);
      expect(res.ok).toBe(false);
    });

    it('rejects message with invalid role', async () => {
      const res = await dbSet(
        `users/${userA.uid}/messages`,
        [{ role: 'hacker', parts: [{ text: 'Bad' }] }],
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects message text exceeding 50000 characters', async () => {
      const res = await dbSet(
        `users/${userA.uid}/messages`,
        [{ role: 'user', parts: [{ text: 'x'.repeat(50001) }] }],
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects message with unexpected fields', async () => {
      const res = await dbSet(
        `users/${userA.uid}/messages`,
        [{ role: 'user', parts: [{ text: 'ok' }], evil: true }],
        userA.token,
      );
      expect(res.ok).toBe(false);
    });
  });

  // ---- users/{uid}/data ----

  describe('users/{uid}/data', () => {
    it('owner can read own data', async () => {
      const res = await dbGet(`users/${userA.uid}/data`, userA.token);
      expect(res.ok).toBe(true);
    });

    it('owner can write valid data entries', async () => {
      const res = await dbSet(
        `users/${userA.uid}/data`,
        [{ id: 1, date: '2024-02-01', weight: 74.5, completed: false }],
        userA.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/data`, [
        {
          id: 1,
          date: '2024-01-15',
          weight: 75,
          kcal: 2000,
          protein: 150,
          fat: 70,
          carbs: 200,
          completed: true,
        },
      ]);
    });

    it('other user cannot read data', async () => {
      const res = await dbGet(`users/${userA.uid}/data`, userB.token);
      expect(res.ok).toBe(false);
    });

    it("trainer can read connected trainee's data", async () => {
      const res = await dbGet(`users/${userA.uid}/data`, trainer.token);
      expect(res.ok).toBe(true);
    });

    it("trainer cannot write trainee's data", async () => {
      const res = await dbSet(
        `users/${userA.uid}/data`,
        [{ id: 99, date: '2024-03-01' }],
        trainer.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects data entry missing required id and date', async () => {
      const res = await dbSet(
        `users/${userA.uid}/data`,
        [{ weight: 75 }],
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('accepts data entry with null optional fields', async () => {
      const res = await dbSet(
        `users/${userA.uid}/data`,
        [{ id: 1, date: '2024-01-15', weight: null, kcal: null }],
        userA.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/data`, [
        {
          id: 1,
          date: '2024-01-15',
          weight: 75,
          kcal: 2000,
          protein: 150,
          fat: 70,
          carbs: 200,
          completed: true,
        },
      ]);
    });
  });

  // ---- users/{uid}/limits ----

  describe('users/{uid}/limits', () => {
    it('owner can read own limits', async () => {
      const res = await dbGet(`users/${userA.uid}/limits`, userA.token);
      expect(res.ok).toBe(true);
    });

    it("admin can read any user's limits", async () => {
      const res = await dbGet(`users/${userA.uid}/limits`, admin.token);
      expect(res.ok).toBe(true);
    });

    it('admin can write limits and change max', async () => {
      const res = await dbSet(
        `users/${userA.uid}/limits`,
        { max: 20 },
        admin.token,
      );
      expect(res.ok).toBe(true);
    });

    it('owner cannot change existing max value', async () => {
      // max is currently 20 (set by admin above); owner tries 50
      const res = await dbSet(
        `users/${userA.uid}/limits`,
        { max: 50 },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('owner can write limits with same max value', async () => {
      const res = await dbSet(
        `users/${userA.uid}/limits`,
        { max: 20 },
        userA.token,
      );
      expect(res.ok).toBe(true);
    });

    it('other user cannot access limits', async () => {
      const res = await dbGet(`users/${userA.uid}/limits`, userB.token);
      expect(res.ok).toBe(false);
    });

    it('rejects limits with max below -1', async () => {
      const res = await dbSet(
        `users/${userA.uid}/limits`,
        { max: -2 },
        admin.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects limits without max field', async () => {
      const res = await dbSet(
        `users/${userA.uid}/limits`,
        { remaining: 5 },
        admin.token,
      );
      expect(res.ok).toBe(false);
    });
  });

  // ---- users/{uid}/calendarNotes ----

  describe('users/{uid}/calendarNotes', () => {
    it('owner can read calendar notes', async () => {
      const res = await dbGet(`users/${userA.uid}/calendarNotes`, userA.token);
      expect(res.ok).toBe(true);
    });

    it('owner can write calendar notes', async () => {
      const res = await dbSet(
        `users/${userA.uid}/calendarNotes`,
        { '2024-02-01': 'New note' },
        userA.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/calendarNotes`, {
        '2024-01-15': 'Test note',
      });
    });

    it("trainer can read connected trainee's notes", async () => {
      const res = await dbGet(
        `users/${userA.uid}/calendarNotes`,
        trainer.token,
      );
      expect(res.ok).toBe(true);
    });

    it('other user cannot read calendar notes', async () => {
      const res = await dbGet(`users/${userA.uid}/calendarNotes`, userB.token);
      expect(res.ok).toBe(false);
    });

    it('rejects note with invalid date key', async () => {
      const res = await dbSet(
        `users/${userA.uid}/calendarNotes`,
        { 'not-a-date': 'Bad note' },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects note exceeding 2000 characters', async () => {
      const res = await dbSet(
        `users/${userA.uid}/calendarNotes`,
        { '2024-01-15': 'x'.repeat(2001) },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });
  });

  // ---- users/{uid}/calendarEntries ----

  describe('users/{uid}/calendarEntries', () => {
    it('owner can read calendar entries', async () => {
      const res = await dbGet(
        `users/${userA.uid}/calendarEntries`,
        userA.token,
      );
      expect(res.ok).toBe(true);
    });

    it('owner can write valid calendar entry', async () => {
      const res = await dbSet(
        `users/${userA.uid}/calendarEntries`,
        {
          '2024-02-01': {
            e1: {
              id: 'e1',
              type: 'custom',
              name: 'Yoga',
              icon: 'yoga',
              color: 'green',
            },
          },
        },
        userA.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/calendarEntries`, {
        '2024-01-15': {
          entry1: {
            id: 'entry1',
            type: 'custom',
            name: 'Morning Run',
            icon: 'running',
            color: 'blue',
          },
        },
      });
    });

    it("trainer can read connected trainee's entries", async () => {
      const res = await dbGet(
        `users/${userA.uid}/calendarEntries`,
        trainer.token,
      );
      expect(res.ok).toBe(true);
    });

    it('other user cannot read calendar entries', async () => {
      const res = await dbGet(
        `users/${userA.uid}/calendarEntries`,
        userB.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects entry with mismatched id', async () => {
      const res = await dbSet(
        `users/${userA.uid}/calendarEntries`,
        {
          '2024-01-15': {
            entry1: {
              id: 'WRONG',
              type: 'custom',
              name: 'Bad',
              icon: 'x',
              color: 'red',
            },
          },
        },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects entry with invalid type', async () => {
      const res = await dbSet(
        `users/${userA.uid}/calendarEntries`,
        {
          '2024-01-15': {
            e1: { id: 'e1', type: 'invalid', name: 'Bad' },
          },
        },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects entry with invalid date key', async () => {
      const res = await dbSet(
        `users/${userA.uid}/calendarEntries`,
        {
          'bad-date': {
            e1: {
              id: 'e1',
              type: 'custom',
              name: 'Bad',
              icon: 'x',
              color: 'red',
            },
          },
        },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('activity type requires activityId', async () => {
      const res = await dbSet(
        `users/${userA.uid}/calendarEntries`,
        {
          '2024-01-15': {
            e1: { id: 'e1', type: 'activity', name: 'Should fail' },
          },
        },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('activity type with valid activityId succeeds', async () => {
      const res = await dbSet(
        `users/${userA.uid}/calendarEntries`,
        {
          '2024-01-15': {
            e1: { id: 'e1', type: 'activity', activityId: 'running' },
          },
        },
        userA.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/calendarEntries`, {
        '2024-01-15': {
          entry1: {
            id: 'entry1',
            type: 'custom',
            name: 'Morning Run',
            icon: 'running',
            color: 'blue',
          },
        },
      });
    });
  });

  // ---- users/{uid}/trainerCalendar ----

  describe('users/{uid}/trainerCalendar', () => {
    it("trainer can write to connected trainee's trainerCalendar", async () => {
      const res = await dbSet(
        `users/${userA.uid}/trainerCalendar`,
        { '2024-03-01': true },
        trainer.token,
      );
      expect(res.ok).toBe(true);
    });

    it('owner cannot write to own trainerCalendar', async () => {
      const res = await dbSet(
        `users/${userA.uid}/trainerCalendar`,
        { '2024-03-02': true },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('owner can delete own trainerCalendar date entry', async () => {
      // Ensure there's an entry to delete
      await adminSet(`users/${userA.uid}/trainerCalendar/2024-03-01`, true);

      const res = await dbRemove(
        `users/${userA.uid}/trainerCalendar/2024-03-01`,
        userA.token,
      );
      expect(res.ok).toBe(true);
    });

    it('owner can read own trainerCalendar', async () => {
      const res = await dbGet(
        `users/${userA.uid}/trainerCalendar`,
        userA.token,
      );
      expect(res.ok).toBe(true);
    });

    it('other user cannot access trainerCalendar', async () => {
      const res = await dbGet(
        `users/${userA.uid}/trainerCalendar`,
        userB.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects non-boolean value', async () => {
      const res = await dbSet(
        `users/${userA.uid}/trainerCalendar`,
        { '2024-03-01': 'not-boolean' },
        trainer.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects invalid date key', async () => {
      const res = await dbSet(
        `users/${userA.uid}/trainerCalendar`,
        { invalid: true },
        trainer.token,
      );
      expect(res.ok).toBe(false);
    });
  });

  // ---- users/{uid}/activityCategories ----

  describe('users/{uid}/activityCategories', () => {
    it('owner can read own activity categories', async () => {
      const res = await dbGet(
        `users/${userA.uid}/activityCategories`,
        userA.token,
      );
      expect(res.ok).toBe(true);
    });

    it('owner can write valid activity categories', async () => {
      const res = await dbSet(
        `users/${userA.uid}/activityCategories`,
        {
          _initialized: true,
          items: [{ id: 'c2', icon: 'swim', name: 'Swimming', color: 'cyan' }],
        },
        userA.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/activityCategories`, {
        _initialized: true,
        items: [{ id: 'cat1', icon: 'run', name: 'Running', color: 'blue' }],
      });
    });

    it("trainer can read connected trainee's categories", async () => {
      const res = await dbGet(
        `users/${userA.uid}/activityCategories`,
        trainer.token,
      );
      expect(res.ok).toBe(true);
    });

    it("trainer can write connected trainee's categories", async () => {
      const res = await dbSet(
        `users/${userA.uid}/activityCategories`,
        {
          _initialized: true,
          items: [{ id: 'tc1', icon: 'lift', name: 'Weights', color: 'red' }],
        },
        trainer.token,
      );
      expect(res.ok).toBe(true);
      await adminSet(`users/${userA.uid}/activityCategories`, {
        _initialized: true,
        items: [{ id: 'cat1', icon: 'run', name: 'Running', color: 'blue' }],
      });
    });

    it('other user cannot access activity categories', async () => {
      const res = await dbGet(
        `users/${userA.uid}/activityCategories`,
        userB.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects writing to unexpected key under activityCategories', async () => {
      const res = await dbSet(
        `users/${userA.uid}/activityCategories`,
        { _initialized: true, items: null, extra: 'bad' },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects category item missing required fields', async () => {
      const res = await dbSet(
        `users/${userA.uid}/activityCategories`,
        { _initialized: true, items: [{ id: 'c1', icon: 'run' }] },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });
  });

  // ---- trainerInvites ----

  describe('trainerInvites', () => {
    it('trainer can create an invite', async () => {
      const res = await dbSet(
        `trainerInvites/INV001`,
        { trainerId: trainer.uid, connectionId: connectionId },
        trainer.token,
      );
      expect(res.ok).toBe(true);
    });

    it('any authenticated user can read a specific invite', async () => {
      const res = await dbGet('trainerInvites/INV001', userA.token);
      expect(res.ok).toBe(true);
    });

    it('non-trainer cannot create an invite', async () => {
      const res = await dbSet(
        `trainerInvites/INV002`,
        { trainerId: userA.uid, connectionId: 'conn-fake' },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('trainer can delete own invite', async () => {
      const res = await dbRemove('trainerInvites/INV001', trainer.token);
      expect(res.ok).toBe(true);
    });

    it('unauthenticated user cannot read invite', async () => {
      const res = await dbGet('trainerInvites/INV001');
      expect(res.ok).toBe(false);
    });

    it('rejects invite missing required fields', async () => {
      const res = await dbSet(
        'trainerInvites/INV003',
        { trainerId: trainer.uid },
        trainer.token,
      );
      expect(res.ok).toBe(false);
    });
  });

  // ---- trainerConnections ----

  describe('trainerConnections', () => {
    it('trainer can create a pending connection', async () => {
      const res = await dbSet(
        'trainerConnections/conn-new',
        {
          trainerId: trainer.uid,
          traineeId: '',
          status: 'pending',
          inviteCode: 'XYZ789',
          createdAt: Date.now(),
        },
        trainer.token,
      );
      expect(res.ok).toBe(true);
      await adminRemove('trainerConnections/conn-new');
    });

    it('regular user cannot create a connection', async () => {
      const res = await dbSet(
        'trainerConnections/conn-bad',
        {
          trainerId: userA.uid,
          traineeId: '',
          status: 'pending',
          inviteCode: 'BAD001',
          createdAt: Date.now(),
        },
        userA.token,
      );
      expect(res.ok).toBe(false);
    });

    it('trainer can read own connection', async () => {
      const res = await dbGet(
        `trainerConnections/${connectionId}`,
        trainer.token,
      );
      expect(res.ok).toBe(true);
    });

    it('trainee can read own connection', async () => {
      const res = await dbGet(
        `trainerConnections/${connectionId}`,
        userA.token,
      );
      expect(res.ok).toBe(true);
    });

    it('unrelated user cannot read a connection', async () => {
      const res = await dbGet(
        `trainerConnections/${connectionId}`,
        userB.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects connection with invalid status', async () => {
      const res = await dbSet(
        'trainerConnections/conn-invalid',
        {
          trainerId: trainer.uid,
          traineeId: '',
          status: 'invalid',
          inviteCode: 'CODE01',
          createdAt: Date.now(),
        },
        trainer.token,
      );
      expect(res.ok).toBe(false);
    });

    it('trainer can delete own connection', async () => {
      // Create a temporary connection
      await adminSet('trainerConnections/conn-del', {
        trainerId: trainer.uid,
        traineeId: userA.uid,
        status: 'active',
        inviteCode: 'DEL001',
        createdAt: Date.now(),
      });

      const res = await dbRemove('trainerConnections/conn-del', trainer.token);
      expect(res.ok).toBe(true);
    });
  });

  // ---- trainingSessions ----

  describe('trainingSessions', () => {
    const sessionData = {
      connectionId: 'conn-test-1',
      trainerId: '',
      traineeId: '',
      date: '2024-03-01',
      status: 'planned',
      trainerConfirmed: false,
      paymentStatus: 'unpaid',
      createdAt: Date.now(),
      createdBy: 'trainer',
    };

    beforeAll(() => {
      sessionData.trainerId = trainer.uid;
      sessionData.traineeId = userA.uid;
    });

    it('trainer can write sessions for their connection', async () => {
      const res = await dbSet(
        `trainingSessions/${connectionId}/session1`,
        sessionData,
        trainer.token,
      );
      expect(res.ok).toBe(true);
    });

    it('trainee can read sessions for their connection', async () => {
      const res = await dbGet(`trainingSessions/${connectionId}`, userA.token);
      expect(res.ok).toBe(true);
    });

    it('trainer can read sessions for their connection', async () => {
      const res = await dbGet(
        `trainingSessions/${connectionId}`,
        trainer.token,
      );
      expect(res.ok).toBe(true);
    });

    it('unrelated user cannot read sessions', async () => {
      const res = await dbGet(`trainingSessions/${connectionId}`, userB.token);
      expect(res.ok).toBe(false);
    });

    it('unrelated user cannot write sessions', async () => {
      const res = await dbSet(
        `trainingSessions/${connectionId}/session2`,
        { ...sessionData, createdBy: 'trainer' },
        userB.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects session with invalid status', async () => {
      const res = await dbSet(
        `trainingSessions/${connectionId}/session3`,
        { ...sessionData, status: 'invalid' },
        trainer.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects session with mismatched connectionId', async () => {
      const res = await dbSet(
        `trainingSessions/${connectionId}/session4`,
        { ...sessionData, connectionId: 'wrong-id' },
        trainer.token,
      );
      expect(res.ok).toBe(false);
    });

    it('rejects session missing required fields', async () => {
      const res = await dbSet(
        `trainingSessions/${connectionId}/session5`,
        { connectionId, date: '2024-03-01' },
        trainer.token,
      );
      expect(res.ok).toBe(false);
    });
  });

  // ---- users/{uid}/trainerId ----

  describe('users/{uid}/trainerId', () => {
    it('owner can read own trainerId', async () => {
      const res = await dbGet(`users/${userA.uid}/trainerId`, userA.token);
      expect(res.ok).toBe(true);
      expect(await res.json()).toBe(trainer.uid);
    });

    it('other user cannot read trainerId', async () => {
      const res = await dbGet(`users/${userA.uid}/trainerId`, userB.token);
      expect(res.ok).toBe(false);
    });

    it('admin can delete trainerId', async () => {
      // Save and remove
      await adminSet(`users/${userB.uid}/trainerId`, trainer.uid);
      const res = await dbRemove(`users/${userB.uid}/trainerId`, admin.token);
      expect(res.ok).toBe(true);
    });

    it('admin cannot directly set trainerId due to validation constraints', async () => {
      // Validate rule requires !data.exists(), matching connection, and auth.uid === traineeId
      // Admin does not satisfy the traineeId check, so write is denied by validation
      const res = await dbSet(
        `users/${userA.uid}/trainerId`,
        trainer.uid,
        admin.token,
      );
      expect(res.ok).toBe(false);
    });
  });
});
