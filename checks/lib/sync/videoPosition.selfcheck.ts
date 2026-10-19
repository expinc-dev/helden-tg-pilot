// Runnable self-check for the pure video position estimate:
//   npx tsx checks/lib/sync/videoPosition.selfcheck.ts
// Excluded from the app build (tsconfig.app.json).
import { estimatePositionSec } from '../../../src/lib/sync/videoPosition'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: number, b: number, msg: string) =>
  ok(Math.abs(a - b) < 1e-9, `${msg} (got ${a}, want ${b})`)

// no node yet -> 0
eq(estimatePositionSec(null, 5_000), 0, 'null playback is 0')

// paused: the stored position is static, no matter how long ago it was written
eq(
  estimatePositionSec({ state: 'paused', positionSec: 42, updatedAt: 1_000 }, 99_000),
  42,
  'paused keeps stored position'
)

// playing: stored position + elapsed since the write
eq(
  estimatePositionSec({ state: 'playing', positionSec: 30, updatedAt: 10_000 }, 22_500),
  42.5,
  'playing adds elapsed seconds'
)

// the bug case: host embed stalled at 0, but the room has been playing for 12s
eq(
  estimatePositionSec({ state: 'playing', positionSec: 0, updatedAt: 1_000 }, 13_000),
  12,
  'playing from 0 for 12s is 12, not 0'
)

// clamped to a known duration (video finished, node still says playing)
eq(
  estimatePositionSec({ state: 'playing', positionSec: 100, updatedAt: 0 }, 60_000, 126),
  126,
  'clamped to duration'
)

// unknown duration (0) is never used as a clamp
eq(
  estimatePositionSec({ state: 'playing', positionSec: 100, updatedAt: 0 }, 60_000, 0),
  160,
  'duration 0 does not clamp'
)

// a clock that went backwards must not rewind the position
eq(
  estimatePositionSec({ state: 'playing', positionSec: 10, updatedAt: 50_000 }, 40_000),
  10,
  'negative elapsed is ignored'
)

// missing positionSec / updatedAt (legacy node) degrade to what is known
eq(estimatePositionSec({ state: 'playing' }, 9_000), 0, 'playing without fields is 0')
eq(estimatePositionSec({ state: 'paused', positionSec: -3 }, 9_000), 0, 'negative stored is 0')

console.log('videoPosition.selfcheck: OK')
