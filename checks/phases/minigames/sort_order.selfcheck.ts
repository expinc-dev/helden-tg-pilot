// Runnable self-check for the sort_order scorer + round-diff helpers. Pure
// functions, no Firebase.
//   npx tsx checks/phases/minigames/sort_order.selfcheck.ts
//
// Import path fixed here: this used to point at a flat
// src/phases/minigames/sort_order.score module that no longer exists (the
// template moved to src/phases/Minigames/SortOrder/score.ts at some point)
// and this check was left stale, unrunnable, and silently not verifying
// anything since then.
import {
  applyRoundDiff,
  roundItemSets,
  scoreSortOrder,
} from '../../../src/phases/Minigames/SortOrder/score'

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
  rounds: [],
}
const phaseStartMs = 1_000_000

// Exact match + timestamp inside phase -> correct + elapsedMs computed.
{
  const r = scoreSortOrder({
    config,
    answer: ['a', 'b', 'c'],
    answerSubmittedAt: phaseStartMs + 5_000,
    phaseStartMs,
  })!
  ok(r.correct === true, 'exact match -> correct')
  ok(r.answered === true, 'exact match -> answered')
  ok(r.elapsedMs === 5_000, `elapsedMs 5s (got ${r.elapsedMs})`)
}

// Wrong order but complete -> answered=true, correct=false.
{
  const r = scoreSortOrder({
    config,
    answer: ['c', 'b', 'a'],
    answerSubmittedAt: phaseStartMs + 3_000,
    phaseStartMs,
  })!
  ok(r.correct === false, 'wrong order -> not correct')
  ok(r.answered === true, 'wrong order but complete -> answered')
}

// Partial (missing one item) -> answered=false.
{
  const r = scoreSortOrder({
    config,
    answer: ['a', 'b'],
    answerSubmittedAt: phaseStartMs + 1_000,
    phaseStartMs,
  })!
  ok(r.answered === false, 'partial -> not answered')
  ok(r.correct === false, 'partial -> not correct')
}

// answer is not an array (no submit / garbage) -> answered=false.
{
  const r = scoreSortOrder({
    config,
    answer: undefined,
    phaseStartMs,
  })!
  ok(r.answered === false && r.correct === false, 'no submit -> 0')
  ok(r.elapsedMs === 0, 'no submit -> elapsed 0')
}

// Non-string entries filtered out -> treated as partial.
{
  const r = scoreSortOrder({
    config,
    answer: ['a', 42, 'c'],
    answerSubmittedAt: phaseStartMs + 500,
    phaseStartMs,
  })!
  ok(r.answered === false, 'non-string entries filtered -> not answered')
}

// answerSubmittedAt before phaseStartMs (clock skew) -> elapsedMs 0, not negative.
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

// --- BRIGHT-966: applyRoundDiff / roundItemSets ---

const baseItems = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
]

// Remove only -> item dropped, order of the rest preserved.
{
  const next = applyRoundDiff(baseItems, { remove: ['b'], add: [] })
  ok(next.length === 2, `remove only -> 2 items left (got ${next.length})`)
  ok(
    next.map((i) => i.id).join(',') === 'a,c',
    `remove only -> a,c left in order (got ${next.map((i) => i.id).join(',')})`
  )
}

// Add with no insertAt -> appended at the end.
{
  const next = applyRoundDiff(baseItems, { remove: [], add: [{ id: 'e', label: 'E' }] })
  ok(
    next.map((i) => i.id).join(',') === 'a,b,c,e',
    `add w/o insertAt -> appended at end (got ${next.map((i) => i.id).join(',')})`
  )
}

// Add with insertAt -> spliced at that index.
{
  const next = applyRoundDiff(baseItems, {
    remove: [],
    add: [{ id: 'e', label: 'E', insertAt: 1 }],
  })
  ok(
    next.map((i) => i.id).join(',') === 'a,e,b,c',
    `add w/ insertAt:1 -> spliced at index 1 (got ${next.map((i) => i.id).join(',')})`
  )
}

// insertAt beyond the array length -> clamped, does not throw, lands at the end.
{
  const next = applyRoundDiff(baseItems, {
    remove: [],
    add: [{ id: 'e', label: 'E', insertAt: 999 }],
  })
  ok(
    next.map((i) => i.id).join(',') === 'a,b,c,e',
    `insertAt out of range -> clamped to end (got ${next.map((i) => i.id).join(',')})`
  )
}

// Remove + add in the same diff (BRIGHT-966's actual round 2 case: C removed, E added).
{
  const next = applyRoundDiff(baseItems, { remove: ['c'], add: [{ id: 'e', label: 'E' }] })
  ok(
    next.map((i) => i.id).join(',') === 'a,b,e',
    `remove c + add e -> a,b,e (got ${next.map((i) => i.id).join(',')})`
  )
}

// roundItemSets folds diffs cumulatively and always has rounds.length + 1 entries.
{
  const cfg = {
    items: baseItems,
    correctOrder: ['a', 'b', 'c'],
    rounds: [
      {
        diff: { remove: ['c'], add: [{ id: 'e', label: 'E' }] },
        correctOrder: ['a', 'b', 'e'],
        timerSeconds: 60,
      },
      { diff: { remove: [], add: [] }, correctOrder: ['a', 'b', 'e'], timerSeconds: 120 },
    ],
  }
  const sets = roundItemSets(cfg)
  ok(sets.length === 3, `roundItemSets -> 3 entries for 2 extra rounds (got ${sets.length})`)
  ok(
    sets[0].map((i) => i.id).join(',') === 'a,b,c',
    `round 1 set unchanged (got ${sets[0].map((i) => i.id).join(',')})`
  )
  ok(
    sets[1].map((i) => i.id).join(',') === 'a,b,e',
    `round 2 set after diff (got ${sets[1].map((i) => i.id).join(',')})`
  )
  ok(
    sets[2].map((i) => i.id).join(',') === 'a,b,e',
    `round 3 set unchanged from round 2 (no-op diff) (got ${sets[2].map((i) => i.id).join(',')})`
  )
}

console.log('sort_order.selfcheck: OK')
