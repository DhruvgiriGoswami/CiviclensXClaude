import { test, expect } from '@playwright/test';

// @live: talks to the real backend on 127.0.0.1:8000. Skipped when it is not running.
test('follow the rupee against the real API @live', async ({ page, request }) => {
  const up = await request.get('http://127.0.0.1:8000/api/v1/audit/overview', { timeout: 3000 }).then((r) => r.ok()).catch(() => false);
  test.skip(!up, 'backend on 127.0.0.1:8000 is not reachable');

  await page.goto('/follow-the-rupee');
  await expect(page.getByText('The audit server is not reachable')).toHaveCount(0);
  await expect(page.locator('path[data-ward]')).toHaveCount(24);
  await page.locator('path[data-ward="F/S"]').click();
  await expect(page.getByRole('heading', { name: /Ward F\/S/ })).toBeVisible();
  for (const tab of ['What looks wrong', 'Who delivered', 'Where the next rupee goes']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tabpanel')).not.toBeEmpty();
  }
});
