// Runnable self-check for the analyze_grid scorer (HLN-007). Pure function —
// no Firebase/React. The gate is scored by exact set-equality on the marked
// empty cells; the analysis questions after it are ungraded.
//   npx tsx checks/phases/minigames/analyze_grid.selfcheck.ts
//
// IMPORTANT: the first block mirrors the REAL production wire format — what
// AnalyzeGrid/player.tsx actually writes to players/{id}/answers/{phaseId}.value
// (an envelope with "row/col" strings). A regression there was invisible to the
// original spec-shaped assertions, so the production path is asserted first.
import {
  isAnalyzeGridGateCorrect,
  scoreAnalyzeGrid,
} from '../../../src/phases/Minigames/AnalyzeGrid/score'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

const config = {
  gridRows: 4,
  gridCols: 6,
  rowLabels: ['A', 'B', 'C', 'D'],
  colLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  emptyCells: [
    { row: 'B', col: 'Thu' },
    { row: 'D', col: 'Tue' },
  ],
  successMessage: 'Correct!',
  analysisQuestions: [{}],
}
const phaseStartMs = 1_000_000

// ── PRODUCTION WIRE FORMAT ──────────────────────────────────────────────────
// Exactly what player.tsx submits: { value: { gate: [...], questions: [...] } }.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: { gate: ['B/Thu', 'D/Tue'], questions: [null] },
    answerSubmittedAt: phaseStartMs + 7_000,
    phaseStartMs,
  })
  ok(r.correct === true, 'production envelope → correct')
  ok(r.answered === true, 'production envelope → answered')
  ok(r.elapsedMs === 7_000, `production envelope elapsedMs (got ${r.elapsedMs})`)
}

// Production envelope, wrong cells → answered but not correct.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: { gate: ['A/Mon', 'C/Fri'], questions: [null] },
    answerSubmittedAt: phaseStartMs + 1_000,
    phaseStartMs,
  })
  ok(r.answered === true, 'production envelope wrong cells → answered')
  ok(r.correct === false, 'production envelope wrong cells → not correct')
}

// Production envelope with an empty gate (never marked) → not answered.
{
  const r = scoreAnalyzeGrid({ config, answer: { gate: [], questions: [null] }, phaseStartMs })
  ok(r.answered === false && r.correct === false, 'empty gate → 0')
}

// Order independence — production envelope, reversed order → still correct.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: { gate: ['D/Tue', 'B/Thu'], questions: [null] },
    answerSubmittedAt: phaseStartMs + 1_000,
    phaseStartMs,
  })
  ok(r.correct === true, 'envelope same set, different order → correct')
}

// Duplicate marks collapse (set semantics, not list) → still correct.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: { gate: ['B/Thu', 'B/Thu', 'D/Tue'], questions: [null] },
    answerSubmittedAt: phaseStartMs + 1_000,
    phaseStartMs,
  })
  ok(r.correct === true, 'duplicate marks → still correct (set semantics)')
  ok(r.answered === true, 'duplicate marks → answered')
}

// ── ACCEPTED ALTERNATE FORMATS (migration / preview safety) ─────────────────
// Bare array of "row/col" strings.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: ['B/Thu', 'D/Tue'],
    answerSubmittedAt: phaseStartMs + 2_000,
    phaseStartMs,
  })
  ok(r.correct === true, 'bare string array → correct')
}

// Bare array of { row, col } objects (config shape).
{
  const r = scoreAnalyzeGrid({
    config,
    answer: [
      { row: 'D', col: 'Tue' },
      { row: 'B', col: 'Thu' },
    ],
    answerSubmittedAt: phaseStartMs + 2_000,
    phaseStartMs,
  })
  ok(r.correct === true, 'bare object array → correct')
}

// Mixed entry shapes in one array → canonicalised together.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: ['B/Thu', { row: 'D', col: 'Tue' }],
    answerSubmittedAt: phaseStartMs + 2_000,
    phaseStartMs,
  })
  ok(r.correct === true, 'mixed entry shapes → correct')
}

// ── NEGATIVE / DEGENERATE ───────────────────────────────────────────────────
// Same count, wrong cells → answered=true, correct=false.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: ['A/Mon', 'C/Fri'],
    answerSubmittedAt: phaseStartMs + 2_000,
    phaseStartMs,
  })
  ok(r.answered === true, 'wrong cells, full count → answered')
  ok(r.correct === false, 'wrong cells → not correct')
}

// Partial (one mark) → answered=false.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: ['B/Thu'],
    answerSubmittedAt: phaseStartMs + 1_000,
    phaseStartMs,
  })
  ok(r.answered === false, 'partial → not answered')
  ok(r.correct === false, 'partial → not correct')
}

// Extra marks (more than the key) → answered=false, not correct.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: ['B/Thu', 'D/Tue', 'A/Mon'],
    answerSubmittedAt: phaseStartMs + 1_000,
    phaseStartMs,
  })
  ok(r.answered === false, 'extra marks → not answered')
  ok(r.correct === false, 'extra marks → not correct')
}

// No submit / empty array → answered=false, elapsed 0.
{
  const r = scoreAnalyzeGrid({ config, answer: [], phaseStartMs })
  ok(r.answered === false && r.correct === false, 'empty answer → 0')
  ok(r.elapsedMs === 0, 'empty answer → elapsed 0')
}

// Non-array garbage → answered=false.
{
  const r = scoreAnalyzeGrid({ config, answer: 'B/Thu', phaseStartMs })
  ok(r.answered === false && r.correct === false, 'non-array → 0')
}

// Envelope-shaped but gate is not an array → answered=false.
{
  const r = scoreAnalyzeGrid({ config, answer: { gate: 'B/Thu' }, phaseStartMs })
  ok(r.answered === false && r.correct === false, 'non-array gate → 0')
}

// Undefined (never submitted).
{
  const r = scoreAnalyzeGrid({ config, answer: undefined, phaseStartMs })
  ok(r.answered === false && r.correct === false, 'undefined → 0')
  ok(r.elapsedMs === 0, 'undefined → elapsed 0')
}

// Malformed entries (missing row/col) are dropped → falls short → not answered.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: [{ row: 'B' }, { col: 'Tue' }],
    answerSubmittedAt: phaseStartMs + 1_000,
    phaseStartMs,
  })
  ok(r.answered === false, 'malformed entries dropped → not answered')
}

// answerSubmittedAt before phaseStartMs (clock skew) → elapsedMs 0, not negative.
{
  const r = scoreAnalyzeGrid({
    config,
    answer: ['B/Thu', 'D/Tue'],
    answerSubmittedAt: phaseStartMs - 100,
    phaseStartMs,
  })
  ok(r.elapsedMs === 0, `clock skew clamped (got ${r.elapsedMs})`)
  ok(r.correct === true, 'clock skew still counts correct')
}

// ── SHARED PREDICATE (used by the live UI gate too) ─────────────────────────
// player.tsx calls this same function, so the UI gate and the flushed score
// can never drift apart. Assert it agrees with the scorer on every shape.
{
  ok(isAnalyzeGridGateCorrect(config, ['B/Thu', 'D/Tue']) === true, 'predicate: strings')
  ok(isAnalyzeGridGateCorrect(config, { gate: ['D/Tue', 'B/Thu'] }) === true, 'predicate: envelope')
  ok(isAnalyzeGridGateCorrect(config, ['A/Mon', 'C/Fri']) === false, 'predicate: wrong cells')
  ok(isAnalyzeGridGateCorrect(config, ['B/Thu']) === false, 'predicate: partial')
  ok(isAnalyzeGridGateCorrect(config, []) === false, 'predicate: empty')
  ok(isAnalyzeGridGateCorrect(config, undefined) === false, 'predicate: undefined')
}

console.log('analyze_grid.selfcheck: OK')
