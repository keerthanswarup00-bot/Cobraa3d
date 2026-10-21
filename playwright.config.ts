import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const port = process.env.PLAYWRIGHT_PORT || '3100'

export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* The local development database is SQLite, so the specs run one at a time
   * to stop the admin fixtures from locking the database file. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    launchOptions: { executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' },
    /* Base URL to use in actions like `await page.goto('/')`. */

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    reuseExistingServer: true,
    command: `./node_modules/.bin/next dev --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    env: { ...process.env, PLAYWRIGHT_PORT: port },
  },
})
