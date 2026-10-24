import { defineConfig } from '@playwright/test';

/** Native smoke tests load the built assets directly; no Vite/HTTP server is used. */
export default defineConfig({
  testDir: './tests/desktop',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['json', { outputFile: 'verification/desktop-results.json' }]],
  outputDir: 'test-results/desktop',
  use: { trace: 'retain-on-failure' },
});
