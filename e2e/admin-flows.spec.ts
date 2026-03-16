import { expect, test } from './auth';

test.describe('Admin flows', () => {
  test('admin can access admin page', async ({ loginAsUser, page }) => {
    await loginAsUser({ claims: { admin: true } });

    await page.goto('/admin');

    await expect(
      page.getByRole('heading', { name: 'Admin Panel' }),
    ).toBeVisible();
  });

  test('admin sees users table', async ({ loginAsUser, page }) => {
    await loginAsUser({ claims: { admin: true } });

    await page.goto('/admin');

    await expect(page.getByText('Users', { exact: true })).toBeVisible();
  });

  test('non-admin is redirected away from admin page', async ({
    loginAsUser,
    page,
  }) => {
    await loginAsUser();

    await page.goto('/admin');

    // Should redirect to dashboard
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('admin sees admin role indicator in sidebar menu', async ({
    loginAsUser,
    page,
  }) => {
    await loginAsUser({ claims: { admin: true } });

    // Open the user profile dropdown
    await page.getByRole('button', { name: /Test User/i }).click();

    // Should see the Admin role label in the dropdown
    await expect(
      page.getByRole('menuitem', { name: /admin panel/i }),
    ).toBeVisible();
  });
});
