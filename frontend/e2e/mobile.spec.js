import { test, expect } from '@playwright/test';
import { offline, SHOTS } from './helpers.js';

test.use({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });

test('phone sheet steps through peek, half and full, and Report a problem is a full-screen sheet', async ({ page }) => {
  await offline(page);
  await page.goto('/');
  if (await page.getByRole('dialog').count()) await page.keyboard.press('Escape');
  const handle = page.getByRole('button', { name: /Area panel/ });
  await expect(handle).toHaveAttribute('aria-label', /closed/);
  await handle.click();
  await expect(handle).toHaveAttribute('aria-label', /half open/);
  await handle.click();
  await expect(handle).toHaveAttribute('aria-label', /fully open/);
  await handle.click();
  await expect(handle).toHaveAttribute('aria-label', /closed/);
  await page.waitForTimeout(400); // let the sheet finish moving before the screenshot
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/home-390.png` });

  await page.getByRole('button', { name: 'Report a problem' }).first().click();
  const box = await page.getByRole('dialog').locator('> div').first().boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(389);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/report-390.png` });
});
