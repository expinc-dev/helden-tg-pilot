// Clock-skew self-check for the pure timer math. No test runner / node types:
//   npx tsx src/sync/useTimer.selfcheck.ts
// Excluded from the app build (tsconfig.app.json).
import { remainingMs } from '../../../src/lib/sync/timermath'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

// Truth: server time = 1000_000, endsAt is 60s later.
const serverNow = 1_000_000
const endsAt = serverNow + 60_000

// A perfectly-synced client: localNow == serverNow, offset 0.
ok(remainingMs(endsAt, serverNow, 0) === 60_000, 'synced client → 60s left')

// Client +30s fast: localNow = serverNow+30_000, so offset = serverNow-localNow = -30_000.
const fast = remainingMs(endsAt, serverNow + 30_000, -30_000)
// Client -30s slow: localNow = serverNow-30_000, offset = +30_000.
const slow = remainingMs(endsAt, serverNow - 30_000, +30_000)

ok(fast === 60_000, '+30s skewed client still sees 60s')
ok(slow === 60_000, '-30s skewed client still sees 60s')
ok(fast === slow, 'skewed clients agree with each other')

// Past the deadline → negative (caller clamps to 0 / expired).
ok(remainingMs(endsAt, serverNow + 61_000, 0) < 0, 'after endsAt → expired')

console.log('useTimer.selfcheck: OK')
