import { test, expect } from '@playwright/test';
import { offline } from './helpers.js';

// Layout and flow stress across screen shapes. Layout tests run offline; the report flow and ask box are @live.
test.use({ reducedMotion: 'reduce' });

const API = 'http://127.0.0.1:8000/api/v1';
const VIEWPORTS = [[360, 740], [390, 844], [844, 390], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1080]];
const PAGES = ['/', '/follow-the-rupee', '/financial-architecture'];
// Blocked API calls and the maps loader log network noise; anything else is a real error.
const NOISE = /Failed to load resource|net::ERR|ERR_FAILED|Failed to fetch|NetworkError|maps\.googleapis|Google Maps|audit server/i;

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errors.push(m.text()); });
  return errors;
}

async function closeDialogs(page) {
  await page.waitForTimeout(400);
  for (let i = 0; i < 3 && await page.getByRole('dialog').count(); i++) await page.keyboard.press('Escape');
}

const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const [w, h] of VIEWPORTS) {
  test.describe(`${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h } });

    for (const path of PAGES) {
      test(`${path} fits in both themes with no errors`, async ({ page }) => {
        const errors = watchErrors(page);
        await offline(page);
        await page.goto(path);
        await page.waitForLoadState('networkidle').catch(() => {});
        await closeDialogs(page);
        const html = page.locator('html');
        for (const _ of [0, 1]) {
          expect(await overflowX(page), 'horizontal scroll').toBeLessThanOrEqual(1);
          const toggle = page.getByRole('button', { name: /Switch to (light|dark) theme/ }).locator('visible=true').first();
          await expect(toggle).toBeVisible();
          const before = await html.getAttribute('class');
          const label = await toggle.getAttribute('aria-label');
          await toggle.click();
          await expect(html).not.toHaveAttribute('class', before);
          await expect(toggle).not.toHaveAttribute('aria-label', label);
          await page.waitForTimeout(500); // let the view-transition reveal finish
        }
        expect(errors).toEqual([]);
      });
    }

    test('home dialogs open inside the viewport and close with Escape', async ({ page }) => {
      await offline(page);
      await page.goto('/');
      await closeDialogs(page);
      if (w >= 1024) {
        const header = page.locator('header').first();
        expect((await header.boundingBox()).height, 'header stays one row').toBeLessThanOrEqual(72);
      }
      const triggers = [page.getByRole('button', { name: 'Report a problem' }).first(), page.getByRole('button', { name: /How it Works/ }).first(),
        page.getByRole('button', { name: /National Directory/ }).first()];
      if (w >= 1280) triggers.push(page.getByRole('button', { name: 'See the budget breakdown' }));
      for (const t of triggers) {
        if (!(await t.isVisible())) continue; // phones tuck some actions into the menu
        await t.click();
        const d = page.getByRole('dialog').last();
        await expect(d).toBeVisible();
        const box = await d.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(-1);
        expect(box.x + box.width).toBeLessThanOrEqual(w + 1);
        expect(await overflowX(page)).toBeLessThanOrEqual(1);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
      }
    });
  });
}

test('rapid map control mashing leaves the app alive', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await closeDialogs(page);
  const zin = page.getByTitle('Zoom In'), zout = page.getByTitle('Zoom Out'), reset = page.getByTitle('Reset to Pan-India View');
  for (let i = 0; i < 10; i++) { await zin.click(); await zout.click(); await reset.click(); }
  await page.mouse.move(700, 450);
  for (let x = 400; x < 1100; x += 50) await page.mouse.move(x, 300 + (x % 200));
  await expect(page.getByRole('button', { name: 'Report a problem' }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('live flows @live', () => {
  test.beforeEach(async ({ request }) => {
    const up = await request.get(`${API}/audit/overview`, { timeout: 3000 }).then((r) => r.ok()).catch(() => false);
    test.skip(!up, 'backend on 127.0.0.1:8000 is not reachable');
  });

  for (const [w, h] of [[390, 844], [1440, 900]]) {
    test(`report with a photo, then upvote once, at ${w}x${h}`, async ({ page, request, context }) => {
      test.setTimeout(60000);
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 19.0176, longitude: 72.8562 });
      await page.setViewportSize({ width: w, height: h });
      let alerted = false;
      page.on('dialog', (d) => { alerted = true; d.dismiss(); });
      await page.goto('/');
      await closeDialogs(page);

      await page.getByRole('button', { name: 'Report a problem' }).first().click();
      const d = page.getByRole('dialog').last();
      await d.getByRole('button', { name: /Auto-Detect GPS/ }).click();
      await expect(d.getByText('Location marked')).toBeVisible({ timeout: 15000 });
      await d.getByPlaceholder(/Near HDFC Bank/).fill('[e2e] <img src=x onerror=alert(1)> Dadar');
      await d.getByRole('button', { name: /Next: Choose Category/ }).click();
      await d.locator('#grievance-category').selectOption({ index: 1 });
      await d.getByRole('button', { name: /Next: Details/ }).click();
      await d.locator('input[type=file]').last().setInputFiles('e2e/fixtures/pothole.jpg');
      await d.locator('#grievance-description').fill('[e2e] Deep pothole outside the bus stop. सड़क पर गड्ढा.');
      const [created] = await Promise.all([
        page.waitForResponse((r) => r.url().endsWith('/api/v1/complaints') && r.request().method() === 'POST'),
        d.getByRole('button', { name: /Submit report/ }).click(),
      ]);
      const id = (await created.json()).complaint_id;
      try {
        await page.waitForResponse((r) => r.url().includes(`/complaints/${id}/media`));
        await expect(page.getByRole('heading', { name: `Complaint CL-${id} filed` })).toBeVisible();
        await page.getByRole('button', { name: 'View complaint' }).click();
        const ticket = page.getByRole('dialog').last();
        await expect(ticket).toContainText('<img src=x onerror=alert(1)>'); // rendered as text
        await expect(ticket.locator('img[src*="/storage/complaints/"]')).toHaveCount(1);
        const up = ticket.getByRole('button', { name: /Upvote \(0\)/ });
        await up.click();
        await expect(ticket.getByRole('button', { name: /Upvoted \(1\)/ })).toBeDisabled();
        await page.waitForTimeout(800);
        await page.reload();
        const server = await (await request.get(`${API}/complaints/${id}`)).json();
        expect(server.upvotes).toBe(1);
        expect(server.media.length).toBe(1);
        expect(alerted, 'no script ran from the title').toBe(false);
      } finally {
        if (process.env.ADMIN_API_KEY) await request.delete(`${API}/complaints/${id}`, { headers: { 'X-Admin-Key': process.env.ADMIN_API_KEY } });
      }
    });
  }

  test('Marathi question on the audit page gets a Marathi answer from Claude', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/follow-the-rupee');
    await page.locator('#ftr-ask').fill('माझ्या तक्रारीचं काय झालं? BMC25-002653');
    let asks = 0;
    page.on('request', (r) => { if (r.url().includes('/audit/ask') && r.method() === 'POST') asks++; });
    await page.locator('form:has(#ftr-ask) button[type=submit]').dblclick(); // impatient double click
    const answer = page.getByTestId('ask-answer');
    await expect(answer).toBeVisible({ timeout: 45000 });
    await expect(answer.locator('p[lang="mr"]')).toContainText(/[ऀ-ॿ]/);
    await expect(answer).toContainText('Answered by Claude');
    expect(asks).toBe(1);
  });

  test('the ask box falls back to offline answers when the server is down', async ({ page }) => {
    await page.goto('/follow-the-rupee');
    await page.route(/\/audit\/ask/, (r) => r.abort());
    await page.locator('#ftr-ask').fill('What happened to BMC25-002653?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(page.getByTestId('ask-answer')).toContainText('Template answer');
  });
});
