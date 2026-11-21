import { test, expect } from '@playwright/test';
import { offline } from './helpers.js';

// Esc closes each dialog and focus goes back to what opened it.
// Reduced motion skips the intro so the map page is ready at once.
test.use({ reducedMotion: 'reduce' });

async function openHome(page) {
  await offline(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /National Directory/ })).toBeVisible();
  // The tour may open after the intro; close it so each test starts clean.
  await page.waitForTimeout(500);
  if (await page.getByRole('dialog').count()) await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function escReturnsFocus(page, trigger, dialogName) {
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: dialogName });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
}

test('app tour opens with focus inside, Esc closes it and returns focus', async ({ page }) => {
  await openHome(page);
  await escReturnsFocus(page, page.getByRole('button', { name: /How it Works/ }), /./);
});

test('national directory, reviews and rating dialogs close with Esc', async ({ page }) => {
  await openHome(page);
  const trigger = page.getByRole('button', { name: /National Directory/ });
  await escReturnsFocus(page, trigger, /Union|leaders|Directory/i);

  await trigger.click();
  await page.getByRole('button', { name: /All States/ }).first().click();
  const reviews = page.getByRole('button', { name: 'No reviews yet', exact: true }).first();
  await reviews.click();
  const reviewDialog = page.getByRole('dialog').last();
  await expect(reviewDialog).toContainText(/review/i);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(reviews).toBeFocused();

  await reviews.click();
  await page.getByRole('button', { name: /Rate This Leader|Be The First To Rate/ }).first().click();
  const rating = page.getByRole('dialog').last();
  await expect(rating.getByRole('button', { name: 'Submit rating' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('budget outlay dialog closes with Esc and returns focus', async ({ page }) => {
  await openHome(page);
  await escReturnsFocus(page, page.getByRole('button', { name: 'See the budget breakdown' }), 'Annual budget outlay');
});

test('report a problem dialog closes with Esc and returns focus', async ({ page }) => {
  await openHome(page);
  await escReturnsFocus(page, page.getByRole('button', { name: /Report/ }).first(), /Report|Raise|problem/i);
});

test('admin complaint detail closes with Esc and returns focus', async ({ page }) => {
  await offline(page);
  await page.route(/:8000\/api\/v1\/complaints\?/, (route) => route.fulfill({
    headers: { 'Access-Control-Allow-Origin': '*' },
    json: { items: [{ complaint_id: 7, title: 'Pothole near the market', description: 'Deep pothole', category: 'Roads & Footpaths', status: 'IN_PROGRESS', priority: 'HIGH', created_at: '2026-11-20T10:00:00' }], total: 1 },
  }));
  await page.goto('/central-authority');
  const inspect = page.getByTitle('Inspect full operational detail').first();
  await escReturnsFocus(page, inspect, 'Complaint details');
});
