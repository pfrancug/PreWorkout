import { expect, test } from './auth';
import { sampleDiaryData, seedData } from './fixtures/seed';

test.describe('Trainee flows', () => {
  test.describe('Diary', () => {
    test('diary page shows the data table', async ({ loginAsUser, page }) => {
      await loginAsUser();
      await page.getByRole('link', { name: /diary/i }).click();

      await expect(page).toHaveURL(/\/diary/);
      await expect(
        page.getByRole('heading', { name: 'Food Diary' }),
      ).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('diary page shows seeded data', async ({ loginAsUser, page }) => {
      const user = await loginAsUser();

      // Seed diary data for this user
      await seedData(`users/${user.uid}/data`, sampleDiaryData);

      // Reload so DataProvider picks up the seeded data
      await page.goto('/diary', { waitUntil: 'networkidle' });

      // Should display the seeded weight values in the table
      await expect(page.locator('table').getByText('75')).toBeVisible();
      await expect(page.locator('table').getByText('74.8')).toBeVisible();
    });

    test('can add a new diary row', async ({ loginAsUser, page }) => {
      await loginAsUser();
      await page.getByRole('link', { name: /diary/i }).click();

      // Click add row button
      await page.getByRole('button', { name: /add/i }).click();

      // A new row should appear in the table
      const rows = page.locator('table tbody tr');
      await expect(rows).toHaveCount(1);
    });
  });

  test.describe('Calendar', () => {
    test('calendar page loads', async ({ loginAsUser, page }) => {
      await loginAsUser();
      await page.getByRole('link', { name: /calendar/i }).click();

      await expect(page).toHaveURL(/\/calendar/);
      await expect(
        page.getByRole('heading', { name: 'Activity Calendar' }),
      ).toBeVisible();
    });
  });

  test.describe('Calculator', () => {
    test('calculator page shows form with pre-filled values', async ({
      loginAsUser,
      page,
    }) => {
      await loginAsUser();
      await page.getByRole('link', { name: /calculator/i }).click();

      await expect(page).toHaveURL(/\/calculator/);
      await expect(
        page.getByRole('heading', { name: 'Calorie Calculator' }),
      ).toBeVisible();

      // Pre-filled from seeded settings (age: 30, height: 175)
      await expect(page.locator('#age')).toHaveValue('30');
      await expect(page.locator('#height')).toHaveValue('175');
    });

    test('calculator updates results when inputs change', async ({
      loginAsUser,
      page,
    }) => {
      await loginAsUser();
      await page.getByRole('link', { name: /calculator/i }).click();

      // Fill in weight
      await page.locator('#weight').fill('80');

      // Results should be visible (TDEE display)
      await expect(
        page.getByText('Your Daily Energy Expenditure'),
      ).toBeVisible();
    });
  });

  test.describe('Settings', () => {
    test('profile settings shows user data', async ({ loginAsUser, page }) => {
      await loginAsUser();
      await page.getByRole('link', { name: /profile/i }).click();

      await expect(page).toHaveURL(/\/settings\/profile/);
      await expect(page.locator('#name')).toHaveValue('Test User');
      await expect(page.locator('#age')).toHaveValue('30');
      await expect(page.locator('#height')).toHaveValue('175');
    });

    test('can update profile name', async ({ loginAsUser, page }) => {
      await loginAsUser();
      await page.getByRole('link', { name: /profile/i }).click();

      // Change name
      await page.locator('#name').fill('Updated User');

      // Save button should be enabled
      const saveButton = page.getByRole('button', { name: /save/i });
      await expect(saveButton).toBeEnabled();

      // Click save
      await saveButton.click();

      // Expect a success indicator (toast or button disabling)
      await expect(saveButton).toBeDisabled({ timeout: 5000 });
    });
  });
});
