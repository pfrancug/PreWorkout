import { expect, test } from '@playwright/test';

test.describe('Application smoke test', () => {
  test('login page loads and shows sign-in button', async ({ page }) => {
    await page.goto('/login');

    await expect(
      page.getByRole('button', { name: /sign in with google/i }),
    ).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('privacy page is accessible without auth', async ({ page }) => {
    await page.goto('/privacy');

    await expect(
      page.getByText('Privacy Policy', { exact: true }),
    ).toBeVisible();
  });

  test('terms page is accessible without auth', async ({ page }) => {
    await page.goto('/terms');

    await expect(
      page.getByText('Terms of Service', { exact: true }),
    ).toBeVisible();
  });
});
