import { defineConfig } from '@playwright/test'
import path from 'path'
import { API_BASE_URL } from './e2e/api-base'

// The venv layout differs by platform, and inline `VAR=value cmd` prefixes are
// POSIX-only, so the interpreter is addressed directly and the environment is
// passed through `env` rather than through a shell.
const backendPython = process.platform === 'win32'
  ? path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe')
  : path.join(__dirname, '..', 'backend', 'venv', 'bin', 'python')

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    // Left as localhost: the Next dev server only allow-lists that host for
    // its own dev resources, and blocks chunk requests from 127.0.0.1.
    baseURL: 'http://localhost:4001',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: `"${backendPython}" -m uvicorn app.main:app --host 127.0.0.1 --port 8000`,
      cwd: '../backend',
      env: {
        E2E_TEST_MODE: '1',
        DEVELOPMENT_MODE: '1',
        AUTH_MODE: 'open',
        GOOGLE_API_KEY: 'mock',
      },
      port: 8000,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Set explicitly so a developer's .env.local, which may point the dev
      // server at a running deployment, cannot aim the suite at real data.
      command: 'pnpm run dev',
      env: { BACKEND_URL: API_BASE_URL },
      port: 4001,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
