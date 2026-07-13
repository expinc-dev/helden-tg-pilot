// Runnable self-check for the sort_order scorer. Pure function — no Firebase.
//   npx tsx src/phases/minigames/sort_order.selfcheck.ts
import { scoreSortOrder } from '../../../src/phases/minigames/sort_order.score'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

const config = {
  items: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ],
  correctOrder: ['a', 'b', 'c'],
}
const phaseStartMs = 1_000_000

// Exact match + timestamp inside phase → correct + elapsedMs computed.
{
  const r = scoreSortOrder({
    config,
    answer: ['a', 'b', 'c'],
    answerSubmittedAt: phaseStartMs + 5_000,
    phaseStartMs,
  })!
  ok(r.correct === true, 'exact match → correct')
  ok(r.answered === true, 'exact match → answered')
  ok(r.elapsedMs === 5_000, `elapsedMs 5s (got ${r.elapsedMs})`)
}

// Wrong order but complete → answered=true, correct=false.
{
  const r = scoreSortOrder({
    config,
    answer: ['c', 'b', 'a'],
    answerSubmittedAt: phaseStartMs + 3_000,
    phaseStartMs,
  })!
  ok(r.correct === false, 'wrong order → not correct')
  ok(r.answered === true, 'wrong order but complete → answered')
}

// Partial (missing one item) → answered=false.
{
  const r = scoreSortOrder({
    config,
    answer: ['a', 'b'],
    answerSubmittedAt: phaseStartMs + 1_000,
    phaseStartMs,
  })!
  ok(r.answered === false, 'partial → not answered')
  ok(r.correct === false, 'partial → not correct')
}

// answer is not an array (no submit / garbage) → answered=false.
{
  const r = scoreSortOrder({
    config,
    answer: undefined,
    phaseStartMs,
  })!
  ok(r.answered === false && r.correct === false, 'no submit → 0')
  ok(r.elapsedMs === 0, 'no submit → elapsed 0')
}

// Non-string entries filtered out → treated as partial.
{
  const r = scoreSortOrder({
    config,
    answer: ['a', 42, 'c'],
    answerSubmittedAt: phaseStartMs + 500,
    phaseStartMs,
  })!
  ok(r.answered === false, 'non-string entries filtered → not answered')
}

// answerSubmittedAt before phaseStartMs (clock skew) → elapsedMs 0, not negative.
{
  const r = scoreSortOrder({
    config,
    answer: ['a', 'b', 'c'],
    answerSubmittedAt: phaseStartMs - 100,
    phaseStartMs,
  })!
  ok(r.elapsedMs === 0, `clock skew clamped (got ${r.elapsedMs})`)
  ok(r.correct === true, 'clock skew still counts correct')
}

console.log('sort_order.selfcheck: OK')
