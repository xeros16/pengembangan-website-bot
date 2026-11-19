import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.E2E_CHROMIUM_EXECUTABLE;
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3010';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: executablePath ? 'off' : 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: process.env.E2E_EXTERNAL_SERVER === 'true' ? undefined : {
    command: 'npm run website',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PORTFOLIO_WEB_HOST: '127.0.0.1',
      PORTFOLIO_WEB_PORT: new URL(baseURL).port || '3010',
    },
  },
});
