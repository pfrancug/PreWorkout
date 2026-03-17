import { expect, test } from './auth';
import { seedData } from './fixtures/seed';

test.describe('Sharing preferences', () => {
  test.describe('Trainee sharing page', () => {
    const setupConnection = async (traineeUid: string, trainerUid: string) => {
      const connectionId = 'conn-sharing-test';
      await seedData(`trainerConnections/${connectionId}`, {
        trainerId: trainerUid,
        traineeId: traineeUid,
        status: 'active',
        createdAt: Date.now(),
      });
      await seedData(`users/${traineeUid}/trainerId`, trainerUid);
      await seedData(`users/${traineeUid}/trainerConnectionId`, connectionId);

      return connectionId;
    };

    test('trainee can access sharing page and see toggles', async ({
      loginAsUser,
      page,
    }) => {
      // Create trainer first (we only need the uid)
      const trainer = await loginAsUser({
        email: 'trainer-sharing@example.com',
        displayName: 'Sharing Trainer',
        claims: { trainer: true },
      });

      // Create trainee, seed connection
      const trainee = await loginAsUser({
        email: 'trainee-sharing@example.com',
        displayName: 'Sharing Trainee',
      });
      await setupConnection(trainee.uid, trainer.uid);

      // Navigate directly to sharing page
      await page.goto('/trainer/sharing', { waitUntil: 'networkidle' });

      // Should see the toggles
      await expect(
        page.getByRole('heading', { name: /data sharing/i }),
      ).toBeVisible();
      await expect(page.getByText('Always shared')).toBeVisible();
      await expect(page.getByLabel('Calendar Activities')).toBeVisible();
      await expect(page.getByLabel('Diary')).toBeVisible();

      // Both toggles should be off by default
      await expect(page.getByLabel('Calendar Activities')).toHaveAttribute(
        'data-state',
        'unchecked',
      );
      await expect(page.getByLabel('Diary')).toHaveAttribute(
        'data-state',
        'unchecked',
      );
    });

    test('trainee can enable and disable calendar sharing', async ({
      loginAsUser,
      page,
    }) => {
      const trainer = await loginAsUser({
        email: 'trainer-toggle@example.com',
        displayName: 'Toggle Trainer',
        claims: { trainer: true },
      });

      const trainee = await loginAsUser({
        email: 'trainee-toggle@example.com',
        displayName: 'Toggle Trainee',
      });
      await setupConnection(trainee.uid, trainer.uid);

      await page.goto('/trainer/sharing', { waitUntil: 'networkidle' });

      const calendarSwitch = page.getByLabel('Calendar Activities');
      await expect(calendarSwitch).toHaveAttribute('data-state', 'unchecked');

      // Enable
      await calendarSwitch.click();
      await expect(calendarSwitch).toHaveAttribute('data-state', 'checked');

      // Disable
      await calendarSwitch.click();
      await expect(calendarSwitch).toHaveAttribute('data-state', 'unchecked');
    });

    test('trainee can enable diary sharing', async ({ loginAsUser, page }) => {
      const trainer = await loginAsUser({
        email: 'trainer-diary@example.com',
        displayName: 'Diary Trainer',
        claims: { trainer: true },
      });

      const trainee = await loginAsUser({
        email: 'trainee-diary@example.com',
        displayName: 'Diary Trainee',
      });
      await setupConnection(trainee.uid, trainer.uid);

      await page.goto('/trainer/sharing', { waitUntil: 'networkidle' });

      const diarySwitch = page.getByLabel('Diary');
      await expect(diarySwitch).toHaveAttribute('data-state', 'unchecked');

      await diarySwitch.click();
      await expect(diarySwitch).toHaveAttribute('data-state', 'checked');
    });

    test('sharing preferences persist after page reload', async ({
      loginAsUser,
      page,
    }) => {
      const trainer = await loginAsUser({
        email: 'trainer-persist@example.com',
        displayName: 'Persist Trainer',
        claims: { trainer: true },
      });

      const trainee = await loginAsUser({
        email: 'trainee-persist@example.com',
        displayName: 'Persist Trainee',
      });
      await setupConnection(trainee.uid, trainer.uid);

      await page.goto('/trainer/sharing', { waitUntil: 'networkidle' });

      // Enable both toggles
      await page.getByLabel('Calendar Activities').click();
      await page.getByLabel('Diary').click();

      // Wait for save
      await page.waitForTimeout(500);

      // Reload page
      await page.goto('/trainer/sharing', { waitUntil: 'networkidle' });

      // Both should still be enabled
      await expect(page.getByLabel('Calendar Activities')).toHaveAttribute(
        'data-state',
        'checked',
      );
      await expect(page.getByLabel('Diary')).toHaveAttribute(
        'data-state',
        'checked',
      );
    });
  });
});
