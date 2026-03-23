import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  timeout: isCI ? 90000 : 60000,
  expect: {
    timeout: isCI ? 20000 : 15000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    navigationTimeout: isCI ? 60000 : 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: isCI ? 'npx next build && npx next start' : 'npx next dev',
    url: 'http://localhost:3000',
    timeout: isCI ? 300000 : 120000,
    reuseExistingServer: !isCI,
  },
})
