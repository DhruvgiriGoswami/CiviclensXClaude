import { test, expect } from '@playwright/test';
import { offline } from './helpers.js';

test('the intro plays on the first visit only, then hands over to the tour', async ({ page }) => {
  await offline(page);
  // The reveal lasts under a second, so record that it mounted instead of racing it.
  await page.addInitScript(() => {
    new MutationObserver(() => {
      if (document.querySelector('.civiclens-intro path')) window.__introSeen = (window.__introSeen || 0) + 1;
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/');
  const intro = page.locator('.civiclens-intro');
  await expect.poll(() => page.evaluate(() => window.__introSeen || 0)).toBeGreaterThan(0);
  await expect(intro).toHaveCount(0, { timeout: 3000 });
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: /National Directory/ })).toBeVisible();
  expect(await page.evaluate(() => window.__introSeen || 0)).toBe(0);
  await expect(page.locator('.civiclens-intro')).toHaveCount(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the intro is skipped at once', async ({ page }) => {
    await offline(page);
    await page.goto('/');
    await expect(page.locator('.civiclens-intro')).toHaveCount(0, { timeout: 300 });
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
