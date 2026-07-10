// Runnable self-check for the answeredCount race guard. No test runner:
//   npx tsx src/sync/submitAnswer.selfcheck.ts
// Firebase runTransaction atomicity is a well-known guarantee; we only prove
// bumpAnswered() is idempotent per keyId, so any interleaving of applies still
// converges to one count per unique key.
import { type AnsweredNode, bumpAnswered } from './answeredBump'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

// Same player/team bumps 20x → count stays 1. Individual mode: keyId = playerId.
let n: AnsweredNode | null = null
for (let i = 0; i < 20; i++) n = bumpAnswered(n, 'q0', 'p1')
ok(n!.answeredCount!.q0 === 1, `same keyId x20 → 1 (got ${n!.answeredCount!.q0})`)
ok(n!.answeredBy!.q0.p1 === true, 'marker set')

// 20 distinct keys → count = 20 (individual: 20 players; team modes: 20 teams).
let m: AnsweredNode | null = null
for (let i = 0; i < 20; i++) m = bumpAnswered(m, 'q0', `k${i}`)
ok(m!.answeredCount!.q0 === 20, `20 distinct keys → 20 (got ${m!.answeredCount!.q0})`)

// Team mode dedup: 3 devices in same team, keyId = teamId → count 1.
let t: AnsweredNode | null = null
for (const device of ['pA', 'pB', 'pC']) {
  void device // caller mapped all three to the same teamId
  t = bumpAnswered(t, 'q0', 'team-x')
}
ok(t!.answeredCount!.q0 === 1, `3 team devices → 1 (got ${t!.answeredCount!.q0})`)

// Interleaved qIds across the same key: two separate counters, both = 1.
let x: AnsweredNode | null = null
x = bumpAnswered(x, 'q0', 'p1')
x = bumpAnswered(x, 'q1', 'p1')
x = bumpAnswered(x, 'q0', 'p1') // dup
x = bumpAnswered(x, 'q1', 'p1') // dup
ok(x!.answeredCount!.q0 === 1 && x!.answeredCount!.q1 === 1, 'per-qId isolation')

// Purity: bumpAnswered does not mutate its input.
const prev: AnsweredNode = {
  answeredCount: { q0: 5 },
  answeredBy: { q0: { p1: true } },
}
const frozen = JSON.stringify(prev)
const next = bumpAnswered(prev, 'q0', 'p2')
ok(JSON.stringify(prev) === frozen, 'no mutation of prev')
ok(next.answeredCount!.q0 === 6, 'new key bumps count')

console.log('submitAnswer.selfcheck: OK')
