import { defineConfig, devices } from '@playwright/test';

// Specs run against vite dev on port 3000. Most block the API so pages use their offline data.
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  workers: 4,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: 'npx vite --port 3000 --strictPort',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60000,
    env: { BROWSER: 'none' },
  },
});
