import { test as base } from '@playwright/test';

import { seedUser, seedUserDirectory } from './fixtures/seed';

const EMULATOR_AUTH_URL = 'http://127.0.0.1:9099';
const PROJECT_ID = 'demo-preworkout';
const TEST_PASSWORD = 'test-password-123';

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
}

let userCounter = 0;

const uniqueId = () =>
  `${process.pid}-${++userCounter}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * Create a user in the Auth Emulator via REST API.
 */
const createEmulatorUser = async (
  email: string,
  displayName: string,
  claims: Record<string, unknown> = {},
): Promise<AuthUser> => {
  const signUpRes = await fetch(
    `${EMULATOR_AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: TEST_PASSWORD,
        displayName,
        returnSecureToken: true,
      }),
    },
  );

  if (!signUpRes.ok) {
    throw new Error(
      `Failed to create emulator user: ${await signUpRes.text()}`,
    );
  }

  const signUpData = (await signUpRes.json()) as {
    localId: string;
    idToken: string;
  };
  const uid = signUpData.localId;

  // Update display name and emailVerified
  await fetch(
    `${EMULATOR_AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:update?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: signUpData.idToken,
        displayName,
        emailVerified: true,
      }),
    },
  );

  // Set custom claims if needed (admin, trainer, etc.)
  if (Object.keys(claims).length > 0) {
    const setClaimsRes = await fetch(
      `${EMULATOR_AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:update`,
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

    if (!setClaimsRes.ok) {
      throw new Error(
        `Failed to set custom claims: ${await setClaimsRes.text()}`,
      );
    }
  }

  return { uid, email, displayName };
};

/**
 * Clear all Auth Emulator accounts.
 */
export const clearAuthEmulator = async (): Promise<void> => {
  await fetch(
    `${EMULATOR_AUTH_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`,
    { method: 'DELETE' },
  );
};

/**
 * Extended Playwright test fixtures with auth helpers.
 */
export const test = base.extend<{
  loginAsUser: (options?: {
    email?: string;
    displayName?: string;
    claims?: Record<string, unknown>;
    seedDefaults?: boolean;
  }) => Promise<AuthUser>;
}>({
  loginAsUser: async ({ page }, use) => {
    const loginFn = async (
      options: {
        email?: string;
        displayName?: string;
        claims?: Record<string, unknown>;
        seedDefaults?: boolean;
      } = {},
    ) => {
      const {
        email = `testuser-${uniqueId()}@example.com`,
        displayName = 'Test User',
        claims = {},
        seedDefaults = true,
      } = options;

      const user = await createEmulatorUser(email, displayName, claims);

      if (seedDefaults) {
        await seedUser(user.uid);
        await seedUserDirectory(user.uid, { displayName, email });
      }

      // Navigate to app so window.__testSignIn is available
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      // Sign in via the exposed Firebase SDK helper (runs in browser context)
      await page.evaluate(
        async ({ email, password }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const win = globalThis as any;
          await win.__testSignIn(email, password);
        },
        { email, password: TEST_PASSWORD },
      );

      // Wait for the app to react to auth state change and navigate
      await page.waitForURL('**/dashboard', { timeout: 10_000 }).catch(() => {
        // Some pages may redirect to / instead of /dashboard
      });
      await page.waitForLoadState('networkidle');

      return user;
    };

    await use(loginFn);
  },
});

export { expect } from '@playwright/test';
