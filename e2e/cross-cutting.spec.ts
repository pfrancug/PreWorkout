import { expect, test } from './auth';

test.describe('Cross-cutting concerns', () => {
  test.describe('i18n language switch', () => {
    test('can switch language to Polish', async ({ loginAsUser, page }) => {
      await loginAsUser();

      // The sidebar has a language toggle button
      await page.getByRole('button', { name: /polski/i }).click();

      // After switching, Dashboard heading should be in Polish ("Pulpit")
      await expect(page.getByRole('heading', { name: 'Pulpit' })).toBeVisible();
    });

    test('login page respects language setting', async ({ page }) => {
      await page.goto('/login');

      // Default should be English
      await expect(
        page.getByRole('button', { name: /sign in with google/i }),
      ).toBeVisible();
    });
  });

  test.describe('Responsive layout', () => {
    test('sidebar collapses on mobile viewport', async ({
      loginAsUser,
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAsUser();

      // Sidebar should be hidden on mobile
      const sidebar = page.locator('[data-sidebar="sidebar"]');
      await expect(sidebar).not.toBeVisible();

      // Toggle button should be visible
      await expect(
        page.getByRole('button', { name: /toggle sidebar/i }),
      ).toBeVisible();
    });

    test('sidebar toggle opens on mobile', async ({ loginAsUser, page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAsUser();

      await page.getByRole('button', { name: /toggle sidebar/i }).click();

      // Sidebar should now be visible
      await expect(page.getByRole('link', { name: /diary/i })).toBeVisible();
    });
  });

  test.describe('Data persistence', () => {
    test('profile changes persist after page reload', async ({
      loginAsUser,
      page,
    }) => {
      await loginAsUser();
      await page.getByRole('link', { name: /profile/i }).click();

      // Change the name
      await page.locator('#name').fill('Persisted Name');
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByRole('button', { name: /save/i })).toBeDisabled({
        timeout: 5000,
      });

      // Reload the page
      await page.reload({ waitUntil: 'networkidle' });

      // Name should persist
      await expect(page.locator('#name')).toHaveValue('Persisted Name');
    });
  });

  test.describe('Navigation', () => {
    test('breadcrumb shows current page name', async ({
      loginAsUser,
      page,
    }) => {
      await loginAsUser();
      await page.getByRole('link', { name: /diary/i }).click();

      // Breadcrumb area should show "Diary"
      await expect(page.locator('header').getByText('Diary')).toBeVisible();
    });

    test('navigating between pages preserves auth state', async ({
      loginAsUser,
      page,
    }) => {
      await loginAsUser();

      // Navigate through multiple pages
      await page.getByRole('link', { name: /diary/i }).click();
      await expect(page).toHaveURL(/\/diary/);

      await page.getByRole('link', { name: /calendar/i }).click();
      await expect(page).toHaveURL(/\/calendar/);

      await page.getByRole('link', { name: /calculator/i }).click();
      await expect(page).toHaveURL(/\/calculator/);

      // Still authenticated — heading visible
      await expect(
        page.getByRole('heading', { name: 'Calorie Calculator' }),
      ).toBeVisible();
    });
  });
});
