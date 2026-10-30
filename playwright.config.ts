import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/workspace/e2e',
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  webServer: { command: 'pnpm dev', url: 'http://localhost:5173', reuseExistingServer: true },
});
