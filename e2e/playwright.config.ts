import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('.', import.meta.url))

// The RTDB emulator needs a JDK >=21, which usually isn't the machine's
// default `java` — scope the override to this one subprocess via PATH so it
// doesn't touch anything else. Path + separator differ per OS; the homebrew
// path is the original (macOS) author's machine, the Windows one is this
// machine's actual JDK 21 install (Eclipse Temurin/Oracle both land under
// `C:\Program Files\Java`). Override JDK21_BIN if yours lives elsewhere.
const jdk21Bin =
  process.env.JDK21_BIN ??
  (process.platform === 'win32'
    ? 'C:\\Program Files\\Java\\jdk-21\\bin'
    : '/opt/homebrew/opt/openjdk@21/bin')
const pathSep = process.platform === 'win32' ? ';' : ':'

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
      // See clear-emulator-port.mjs for why this pre-flight exists.
      command:
        'node clear-emulator-port.mjs && ' +
        'npx firebase-tools emulators:start --project demo-e2e-test --config firebase.json',
      cwd: dir,
      // Auth (9099), not database (9000) — database's port opens first, so
      // waiting on it let the app's very first signInAnonymously() race auth
      // still binding, failing every run with ERR_CONNECTION_REFUSED.
      port: 9099,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        PATH: `${jdk21Bin}${pathSep}${process.env.PATH}`,
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
