import { test, expect } from '@playwright/test';
import { offline } from './helpers.js';

const WO = /WO25-\d{5}/;

test.beforeEach(async ({ page }) => {
  await offline(page);
  await page.goto('/follow-the-rupee');
  await expect(page.getByText('Synthetic data: not BMC records')).toBeVisible();
});

test('clicking a ward fills all four tabs with evidence', async ({ page }) => {
  await expect(page.locator('path[data-ward]')).toHaveCount(24);
  await page.locator('path[data-ward="F/S"]').click();
  await expect(page.getByRole('heading', { name: /Ward F\/S/ })).toBeVisible();

  await expect(page.getByRole('tabpanel')).toContainText('Budget and spend');
  await expect(page.getByRole('tabpanel')).toContainText(WO);

  await page.getByRole('tab', { name: 'What looks wrong' }).click();
  await expect(page.getByRole('tabpanel')).toContainText(WO);
  await expect(page.getByRole('link', { name: /Download flags/ })).toBeVisible();
  await page.getByRole('tabpanel').locator('summary').first().click();
  await expect(page.getByRole('tabpanel').locator('details[open] dl')).toBeVisible();

  await page.getByRole('tab', { name: 'Who delivered' }).click();
  await expect(page.getByRole('tabpanel')).toContainText(/\(synthetic\)/);
  await expect(page.getByRole('tabpanel')).toContainText(WO);

  await page.getByRole('tab', { name: 'Where the next rupee goes' }).click();
  await expect(page.getByRole('tabpanel')).toContainText(/RD\d{4}/);
  await expect(page.getByRole('tabpanel')).toContainText(/Funded|Not funded|Under warranty/);
});

test('the ward list is the keyboard path and tabs move with arrow keys', async ({ page }) => {
  const item = page.getByRole('list', { name: 'Ward list' }).getByRole('button').first();
  await item.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: 'Where the money went' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Where the money went' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'What looks wrong' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'What looks wrong' })).toHaveAttribute('aria-selected', 'true');
});

test('searching a complaint id opens its trail, Esc closes and returns focus', async ({ page }) => {
  const box = page.getByLabel('Find a complaint, work order, road or area');
  await box.fill('BMC25-002653');
  const hit = page.getByRole('list', { name: 'Search results' }).getByRole('button').first();
  await hit.click();
  const dialog = page.getByRole('dialog', { name: /Complaint BMC25-002653/ });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Issue ISS-');
  await expect(dialog).toContainText(WO);
  await expect(dialog).toContainText(/Target \d+ hours/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(box).toBeFocused();
});

test('asking in Marathi gets an answer and a trail link', async ({ page }) => {
  await page.getByLabel('Ask about a complaint in your language').fill('माझ्या तक्रारीचं काय झालं? BMC25-002653');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  const answer = page.getByTestId('ask-answer');
  await expect(answer).toContainText('BMC25-002653');
  await expect(answer.locator('[lang="mr"]')).toBeVisible();
  await expect(answer).toContainText(/Template answer|Answered by Claude/);
  const follow = answer.getByRole('button', { name: /Follow/ });
  await follow.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(follow).toBeFocused();
});

test('a flag opens the complaint trail', async ({ page }) => {
  await page.getByRole('button', { name: /Start with ward/ }).click();
  await page.getByRole('tab', { name: 'What looks wrong' }).click();
  const flag = page.locator('details:has(button:has-text("Follow complaint"))').first();
  await flag.locator('summary').click();
  const follow = flag.getByRole('button', { name: /Follow complaint/ }).first();
  await follow.click();
  await expect(page.getByRole('dialog')).toContainText(/Complaint/);
  await page.keyboard.press('Escape');
  await expect(follow).toBeFocused();
});

test('summary button shows the written summary', async ({ page }) => {
  await page.getByRole('button', { name: /Start with ward/ }).click();
  await page.getByRole('button', { name: 'Write a summary with Claude' }).click();
  await expect(page.getByText(/Template summary|Written by Claude/)).toBeVisible();
});

test('the map toggles between the two measures', async ({ page }) => {
  await page.getByRole('button', { name: 'Amount at risk' }).click();
  await expect(page.getByRole('button', { name: 'Amount at risk' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Legend')).toContainText('₹');
});

test('no horizontal scroll at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /Start with ward/ }).click();
  for (const tab of ['Where the money went', 'What looks wrong', 'Who delivered', 'Where the next rupee goes']) {
    await page.getByRole('tab', { name: tab }).click();
    const overflow = await page.evaluate(() => {
      const root = document.querySelector('.ftr');
      return Math.max(document.documentElement.scrollWidth, root.scrollWidth) - window.innerWidth;
    });
    expect(overflow, `overflow on ${tab}`).toBeLessThanOrEqual(0);
  }
});
