// Runnable self-check for the Level 3A–3C combined bar. No test runner:
//   npx tsx checks/phases/quiz/bundleGroup.selfcheck.ts
// Pure module only (src/phases/Quiz/bundleGroup.ts has type-only imports).
import { bundleOutcomes, levelBundleOf } from '../../../src/phases/Quiz/bundleGroup'

function eq(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error(`FAIL ${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`)
    process.exit(1)
  }
}

const q = (id: string, title: string, type = 'quiz') => ({
  id,
  type,
  title,
  content: { questions: [{}] },
})
const phases = {
  a1: q('a1', 'Level 2E: Refleksi'),
  v3: q('v3', 'L3-0 Video Jembatan', 'video'),
  a: q('a', 'Level 3A: Keaslian'),
  b: q('b', 'Level 3B: Keunikan'),
  c: q('c', 'Level 3C: Kehadiran'),
  v4: q('v4', 'L4-0 Video Giliranmu', 'video'),
  d: q('d', 'Level 4B: Build & Run'),
  l1: q('l1', 'Level 1C: Kuis Mitos AI'),
  l1b: q('l1b', 'Level 1D: Tanam Benih'),
}
const order = ['a1', 'v3', 'a', 'b', 'c', 'v4', 'd']

// Any phase of 3A–3C resolves to the same three blocks, in phaseOrder.
const want = [
  { phaseId: 'a', label: '3A', qIds: ['a_q0'] },
  { phaseId: 'b', label: '3B', qIds: ['b_q0'] },
  { phaseId: 'c', label: '3C', qIds: ['c_q0'] },
]
eq(levelBundleOf(order, phases, phases.a), want, 'from 3A')
eq(levelBundleOf(order, phases, phases.b), want, 'from 3B')
eq(levelBundleOf(order, phases, phases.c), want, 'from 3C')

// Other levels, non-quiz phases and unknown phases keep the per-question blocks.
eq(levelBundleOf(order, phases, phases.a1), null, 'level 2 not bundled')
eq(levelBundleOf(order, phases, phases.d), null, 'level 4 not bundled')
eq(levelBundleOf(['l1', 'l1b'], phases, phases.l1), null, 'level 1 not bundled')
eq(levelBundleOf(order, phases, phases.v3), null, 'video not bundled')
eq(levelBundleOf(order, phases, q('zz', 'Level 3A: x')), null, 'not in phaseOrder')

// A non-3 phase in between splits the bundle.
eq(
  levelBundleOf(['a', 'v3', 'b'], phases, phases.a)?.map((x) => x.label),
  ['3A'],
  'split by intervening phase'
)

const blocks = want
// Only 3A scored: team t1 right, t2 wrong; 3B/3C stay pending (grey).
const m1 = { a_q0: { t1: 'correct', t2: 'wrong' } } as const
eq(bundleOutcomes(blocks, 't1', m1), ['correct', 'pending', 'pending'], '3A done, correct')
eq(bundleOutcomes(blocks, 't2', m1), ['wrong', 'pending', 'pending'], '3A done, wrong')
// A team with no row yet is pending everywhere, never a crash.
eq(bundleOutcomes(blocks, 't3', m1), ['pending', 'pending', 'pending'], 'unknown team')
// All three scored.
const m2 = {
  a_q0: { t1: 'correct' },
  b_q0: { t1: 'wrong' },
  c_q0: { t1: 'correct' },
} as const
eq(bundleOutcomes(blocks, 't1', m2), ['correct', 'wrong', 'correct'], 'all scored')
// Multi-question block: pending until every question is scored; any wrong wins.
const multi = [{ phaseId: 'm', label: '3A', qIds: ['m_q0', 'm_q1'] }]
eq(bundleOutcomes(multi, 't1', { m_q0: { t1: 'correct' } }), ['pending'], 'half scored')
eq(
  bundleOutcomes(multi, 't1', { m_q0: { t1: 'correct' }, m_q1: { t1: 'correct' } }),
  ['correct'],
  'all questions right'
)
eq(
  bundleOutcomes(multi, 't1', { m_q0: { t1: 'wrong' }, m_q1: { t1: 'correct' } }),
  ['wrong'],
  'any wrong'
)

console.log('bundleGroup.selfcheck: OK')
