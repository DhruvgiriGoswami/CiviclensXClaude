// Block the backend so pages fall back to their offline data, like a demo laptop with no server.
export async function offline(page) {
  await page.route(/localhost:8000|127\.0\.0\.1:8000/, (route) => route.abort());
}

export const SHOTS = process.env.E2E_SHOTS || '';
