import { test } from '@playwright/test';
import { offline, SHOTS } from './helpers.js';

// Screenshots for a human look. Runs only when E2E_SHOTS points at a folder.
test.skip(!SHOTS, 'set E2E_SHOTS to a folder to save screenshots');

for (const [w, h] of [[1440, 900], [768, 1024], [390, 844]]) {
  for (const theme of ['light', 'dark']) {
    test(`follow the rupee ${w} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.addInitScript((t) => localStorage.setItem('civiclens_theme_v2', t), theme);
      await offline(page);
      await page.goto('/follow-the-rupee');
      await page.screenshot({ path: `${SHOTS}/ftr-${w}-${theme}-0.png` });
      await page.getByRole('button', { name: /Start with ward/ }).click();
      for (const tab of ['Where the money went', 'What looks wrong', 'Who delivered', 'Where the next rupee goes']) {
        await page.getByRole('tab', { name: tab }).click();
        await page.waitForTimeout(150);
        await page.screenshot({ path: `${SHOTS}/ftr-${w}-${theme}-${tab.split(' ').pop()}.png`, fullPage: false });
      }
    });
  }
}
