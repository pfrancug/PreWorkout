import { expect, test } from './auth';

test.describe('Authentication flows', () => {
  test('authenticated user reaches the dashboard', async ({
    loginAsUser,
    page,
  }) => {
    await loginAsUser();

    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
  });

  test('authenticated user sees sidebar navigation', async ({
    loginAsUser,
    page,
  }) => {
    await loginAsUser();

    await expect(page.getByRole('link', { name: /diary/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /calendar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /calculator/i })).toBeVisible();
  });

  test('user can navigate to diary page', async ({ loginAsUser, page }) => {
    await loginAsUser();

    await page.getByRole('link', { name: /diary/i }).click();

    await expect(page).toHaveURL(/\/diary/);
  });

  test('user can navigate to calendar page', async ({ loginAsUser, page }) => {
    await loginAsUser();

    await page.getByRole('link', { name: /calendar/i }).click();

    await expect(page).toHaveURL(/\/calendar/);
  });

  test('user can navigate to calculator page', async ({
    loginAsUser,
    page,
  }) => {
    await loginAsUser();

    await page.getByRole('link', { name: /calculator/i }).click();

    await expect(page).toHaveURL(/\/calculator/);
  });

  test('user can logout via sidebar menu', async ({ loginAsUser, page }) => {
    await loginAsUser();

    // Open the user profile dropdown in the sidebar footer
    await page.getByRole('button', { name: /Test User/i }).click();

    // Click the logout menu item
    await page.getByRole('menuitem', { name: /logout/i }).click();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });
});
