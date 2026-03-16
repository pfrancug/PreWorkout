/**
 * Test data fixtures for E2E tests.
 * Uses Firebase REST API to seed the Realtime Database emulator directly.
 */

const EMULATOR_DB_URL = 'http://127.0.0.1:9000';
const PROJECT_ID = 'demo-preworkout';

/**
 * Clear all data in the emulator database.
 */
export const clearDatabase = async (): Promise<void> => {
  await fetch(
    `${EMULATOR_DB_URL}/.json?ns=${PROJECT_ID}-default-rtdb&access_token=owner`,
    { method: 'DELETE' },
  );
};

/**
 * Seed data at a specific database path.
 */
export const seedData = async (path: string, data: unknown): Promise<void> => {
  await fetch(
    `${EMULATOR_DB_URL}/${path}.json?ns=${PROJECT_ID}-default-rtdb&access_token=owner`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
};

/**
 * Seed a complete user profile (settings + data + preferences).
 */
export const seedUser = async (
  uid: string,
  options: {
    settings?: Record<string, unknown>;
    data?: Record<string, unknown>[];
    preferences?: Record<string, unknown>;
  } = {},
): Promise<void> => {
  const {
    settings = {
      name: 'Test User',
      age: '30',
      height: '175',
      sex: 'male',
    },
    data = [],
    preferences = {
      sidebarOpen: true,
      chatPanelOpen: false,
      language: 'en',
      defaultCalendarView: 'month',
    },
  } = options;

  await seedData(`users/${uid}/settings`, settings);
  await seedData(`users/${uid}/preferences`, preferences);

  if (data.length > 0) {
    await seedData(`users/${uid}/data`, data);
  }
};

/**
 * Seed the user directory entry for a user.
 */
export const seedUserDirectory = async (
  uid: string,
  entry: {
    displayName?: string;
    email?: string;
    isTrainer?: boolean;
    lastLogin?: string;
  } = {},
): Promise<void> => {
  const {
    displayName = 'Test User',
    email = 'test@example.com',
    isTrainer = false,
    lastLogin = new Date().toISOString(),
  } = entry;

  await seedData(`userDirectory/${uid}`, {
    displayName,
    email,
    isTrainer,
    lastLogin,
  });
};

/** Sample diary rows for seeding. */
export const sampleDiaryData = [
  {
    id: 0,
    date: '2026-03-15',
    weight: 75,
    kcal: 2100,
    protein: 150,
    fat: 70,
    carbs: 230,
    completed: true,
  },
  {
    id: 1,
    date: '2026-03-16',
    weight: 74.8,
    kcal: 1950,
    protein: 140,
    fat: 65,
    carbs: 220,
    completed: false,
  },
];
