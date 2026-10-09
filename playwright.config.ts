import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120 * 1000,
  expect: {
    timeout: 20000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  globalSetup: './e2e/global-setup.ts',
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run start',
      cwd: './auth-server',
      port: 4000,
      reuseExistingServer: true,
      timeout: 180 * 1000,
      env: {
        BOOTSTRAP_ADMIN_EMAIL: 'admin@spplastech.com',
        BOOTSTRAP_ADMIN_PASSWORD: 'Plas!Tech#Boot91',
      },
    },
  ],
});
