// Cross-platform pre-flight for playwright.config.ts's emulator webServer.
// firebase-tools' java child (the actual RTDB emulator) can survive a killed
// parent (e.g. after a previous run's teardown) and squat port 9000 — a fresh
// `emulators:start` then silently fails on THAT port while Playwright's
// readiness probe is fooled by the stale process still answering there,
// leaving auth never actually started. Clear any leftover before every run
// so this is self-healing, not a manual step. `pkill` (the original, macOS
// version of this check) isn't available to the shell Windows spawns
// `command:` strings with, hence a small script instead of an inline one-liner.
import { execSync } from 'node:child_process'

const PORT = 9000

try {
  if (process.platform === 'win32') {
    const out = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, {
      encoding: 'utf8',
    })
    const pids = new Set(
      out
        .split('\n')
        .map((line) => line.trim().split(/\s+/).pop())
        .filter(Boolean)
    )
    for (const pid of pids) execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
  } else {
    execSync('pkill -f firebase-database-emulator', { stdio: 'ignore' })
  }
} catch {
  // Nothing was listening on the port — the common case, not an error.
}
