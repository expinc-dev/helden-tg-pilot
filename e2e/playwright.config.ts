import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('.', import.meta.url))

// T-08 slice E2E — runs the vite dev server against a LOCAL Firebase emulator
// (never the real project; see .env.e2e + e2e/firebase.json). Both are started
// here so `npm run test:e2e` is the only command anyone needs.
export default defineConfig({
  testDir: '.',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5183',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--no-sandbox'] },
  },
  webServer: [
    {
      // firebase-tools' java child (the actual RTDB emulator) can survive a
      // killed parent (e.g. after a previous run's teardown) and squat port
      // 9000 — a fresh `emulators:start` then silently fails on THAT port
      // while Playwright's readiness probe is fooled by the stale process
      // still answering there, leaving auth never actually started. Clear any
      // leftover before every run so this is self-healing, not a manual step.
      command:
        'pkill -f firebase-database-emulator || true; ' +
        'npx firebase-tools emulators:start --project demo-e2e-test --config firebase.json',
      cwd: dir,
      // Auth (9099), not database (9000) — database's port opens first, so
      // waiting on it let the app's very first signInAnonymously() race auth
      // still binding, failing every run with ERR_CONNECTION_REFUSED.
      port: 9099,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      // The RTDB emulator needs a JDK >=21; scoped to this one subprocess so it
      // doesn't touch the machine's default `java` (still 17) for anything else.
      env: {
        ...process.env,
        PATH: `/opt/homebrew/opt/openjdk@21/bin:${process.env.PATH}`,
      },
    },
    {
      command: 'npm run dev -- --mode e2e --port 5183 --strictPort',
      cwd: dir + '/..',
      port: 5183,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
