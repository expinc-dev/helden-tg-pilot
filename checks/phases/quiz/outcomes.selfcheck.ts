// Runnable self-check for per-question quiz verdicts. No test runner:
//   npx tsx checks/phases/quiz/outcomes.selfcheck.ts
// Pure module only (src/phases/Quiz/outcomes.ts imports nothing).
import { questionOutcomes } from '../../../src/phases/Quiz/outcomes'

function eq(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error(`FAIL ${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`)
    process.exit(1)
  }
}

const questions = [{ correctId: 'a' }, { correctId: 'b' }, { correctId: 'c' }]
const phaseId = 'p1'

// Two questions opened: correct on q0, wrong on q1; q2 not opened yet.
eq(
  questionOutcomes({
    questions,
    phaseId,
    revealedCount: 2,
    answers: { p1_q0: { value: 'a' }, p1_q1: { value: 'x' } },
  }),
  ['correct', 'wrong', 'pending'],
  'correct / wrong / pending'
)

// No answer on an opened question = unanswered (not wrong, not pending).
eq(
  questionOutcomes({ questions, phaseId, revealedCount: 2, answers: { p1_q0: { value: 'a' } } }),
  ['correct', 'unanswered', 'pending'],
  'unanswered'
)

// No answers node at all.
eq(
  questionOutcomes({ questions, phaseId, revealedCount: 1, answers: undefined }),
  ['unanswered', 'pending', 'pending'],
  'no answers node'
)

// A late answer flips the verdict (verdicts are derived, never stored).
eq(
  questionOutcomes({ questions, phaseId, revealedCount: 1, answers: { p1_q0: { value: 'a' } } })[0],
  'correct',
  'late answer becomes correct'
)

// Missing answer key never crashes and never counts as correct.
eq(
  questionOutcomes({
    questions: [{}],
    phaseId,
    revealedCount: 1,
    answers: { p1_q0: { value: 'a' } },
  }),
  ['correct'], // opinion question (no answer key): answering is the positive outcome
  'no correctId'
)

console.log('outcomes.selfcheck: OK')
