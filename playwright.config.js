import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  // Wallet generation at tree height 10 takes a few seconds; scrypt at the
  // production work factor takes longer still.
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    // Every test loads dist/index.html over file://, which is how
    // users are told to run it. Serving it over HTTP would test a deployment
    // mode the release does not ship.
    baseURL: undefined,
    trace: 'retain-on-failure',
  },
});

