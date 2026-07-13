// Runnable self-check for pure scoring functions. No test runner:
//   npx tsx src/scoring/score.selfcheck.ts
import type { ScoringConfig } from '@helden-inc/tg-schema'

import {
  scoreAnswer,
  scoreCorrectness,
  scoreParticipation,
  scoreSpeed,
} from '../../../src/lib/scoring/score'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: number, b: number, msg: string) =>
  ok(Math.abs(a - b) < 1e-9, `${msg} (got ${a}, want ${b})`)

const base = { answered: true, elapsedMs: 0, phaseDurationMs: 30_000 }
const cCfg: ScoringConfig = { mode: 'correctness', maxPoints: 100 }
const pCfg: ScoringConfig = { mode: 'participation', maxPoints: 50 }
const sCfg: ScoringConfig = { mode: 'speed', speedBonus: { maxBonus: 200, decaySeconds: 10 } }
const csCfg: ScoringConfig = {
  mode: 'correctness_and_speed',
  maxPoints: 100,
  speedBonus: { maxBonus: 200, decaySeconds: 10 },
}

// correctness: benar → maxPoints; salah → 0
eq(scoreCorrectness(cCfg, { ...base, correct: true }), 100, 'correctness benar')
eq(scoreCorrectness(cCfg, { ...base, correct: false }), 0, 'correctness salah')

// participation: dijawab → maxPoints; tidak dijawab → 0
eq(
  scoreParticipation(pCfg, { ...base, correct: false, answered: true }),
  50,
  'participation dijawab'
)
eq(
  scoreParticipation(pCfg, { ...base, correct: true, answered: false }),
  0,
  'participation tidak dijawab'
)

// speed: benar & instan → maxBonus penuh
eq(scoreSpeed(sCfg, { ...base, correct: true, elapsedMs: 0 }), 200, 'speed instan')
// speed: benar & separuh window → separuh bonus (decay linear)
eq(scoreSpeed(sCfg, { ...base, correct: true, elapsedMs: 5_000 }), 100, 'speed 5s dari 10s')
// speed: benar tapi lewat decay → 0 (di-clamp)
eq(scoreSpeed(sCfg, { ...base, correct: true, elapsedMs: 15_000 }), 0, 'speed lewat decay')
// speed: salah → 0 apapun waktunya
eq(scoreSpeed(sCfg, { ...base, correct: false, elapsedMs: 0 }), 0, 'speed salah = 0')

// correctness_and_speed: benar & instan → 100 + 200
eq(scoreAnswer(csCfg, { ...base, correct: true, elapsedMs: 0 }), 300, 'combo instan')
// benar & lewat decay → 100 + 0
eq(scoreAnswer(csCfg, { ...base, correct: true, elapsedMs: 20_000 }), 100, 'combo tanpa bonus')
// salah → 0 + 0
eq(scoreAnswer(csCfg, { ...base, correct: false, elapsedMs: 0 }), 0, 'combo salah')

// dispatcher: none / undefined → 0
eq(scoreAnswer({ mode: 'none' }, { ...base, correct: true }), 0, 'mode none')
eq(scoreAnswer(undefined, { ...base, correct: true }), 0, 'cfg undefined')

console.log('score.selfcheck: OK')
