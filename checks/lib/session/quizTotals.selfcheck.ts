// Runnable self-check for idempotent quiz totals. No test runner:
//   npx tsx checks/lib/session/quizTotals.selfcheck.ts
// Pure module only (src/lib/session/quizTotals.ts imports nothing).
import {
  type Outcome,
  type QuestionResult,
  applyQuestionResults,
} from '../../../src/lib/session/quizTotals'

function eq(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error(`FAIL ${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`)
    process.exit(1)
  }
}

type Maps = {
  totals: Record<string, number>
  correctCount: Record<string, number>
  wrongCount: Record<string, number>
  qScores: Record<string, number>
  qOutcomes: Record<string, Outcome>
}
const empty = (): Maps => ({
  totals: {},
  correctCount: {},
  wrongCount: {},
  qScores: {},
  qOutcomes: {},
})

// Mirrors what quizScoring.ts persists after each pass.
function pass(m: Maps, results: Record<string, QuestionResult>): Maps {
  const f = applyQuestionResults({
    results,
    prevScores: m.qScores,
    prevOutcomes: m.qOutcomes,
    totals: m.totals,
    correctCount: m.correctCount,
    wrongCount: m.wrongCount,
  })
  const next: Maps = {
    totals: { ...m.totals, ...f.totals },
    correctCount: { ...m.correctCount, ...f.correctCount },
    wrongCount: { ...m.wrongCount, ...f.wrongCount },
    qScores: { ...m.qScores },
    qOutcomes: { ...m.qOutcomes },
  }
  for (const [k, r] of Object.entries(results)) {
    next.qScores[k] = r.score
    next.qOutcomes[k] = r.outcome
  }
  return next
}

// 1) First pass: correct scores, wrong and no-answer are both `wrong` (+0).
const r1: Record<string, QuestionResult> = {
  a: { score: 1000, outcome: 'correct' },
  b: { score: 0, outcome: 'wrong' },
  c: { score: 0, outcome: 'wrong' }, // did not answer
}
let m = pass(empty(), r1)
eq(m.totals, { a: 1000, b: 0, c: 0 }, 'pass 1 totals')
eq(m.correctCount, { a: 1, b: 0, c: 0 }, 'pass 1 correct')
eq(m.wrongCount, { a: 0, b: 1, c: 1 }, 'pass 1 wrong (incl. unanswered)')

// 2) Same results again → nothing changes (idempotent).
const again = pass(m, r1)
eq(again.totals, m.totals, 'rescore totals unchanged')
eq(again.correctCount, m.correctCount, 'rescore correct unchanged')
eq(again.wrongCount, m.wrongCount, 'rescore wrong unchanged')

// 3) Late answer: c actually answered correctly just after pass 1.
m = pass(m, { ...r1, c: { score: 800, outcome: 'correct' } })
eq(m.totals.c, 800, 'late answer adds its score once')
eq(m.correctCount.c, 1, 'late answer counted correct')
eq(m.wrongCount.c, 0, 'late answer removed from wrong')

// 4) Next question accumulates on top (different qId = fresh prev maps).
const q2 = pass(
  { ...m, qScores: {}, qOutcomes: {} },
  {
    a: { score: 0, outcome: 'wrong' },
    b: { score: 900, outcome: 'correct' },
    c: { score: 0, outcome: 'wrong' },
  }
)
eq(q2.totals, { a: 1000, b: 900, c: 800 }, 'question 2 totals accumulate')
eq(q2.correctCount, { a: 1, b: 1, c: 1 }, 'question 2 correct accumulate')
eq(q2.wrongCount, { a: 1, b: 1, c: 1 }, 'question 2 wrong accumulate')

console.log('quizTotals.selfcheck: OK')
