// Pure, idempotent folding of ONE question's result into the running totals.
// No Firebase — so `checks/lib/session/quizTotals.selfcheck.ts` runs under plain
// `npx tsx`.
//
// The old flow added `prior + score` every time a question was scored, so
// scoring the same question twice (to pick up a late answer, after a host
// reload, …) double-counted. Here each question's previous result is stored
// (`questionScores/{qId}`, `questionOutcome/{qId}`) and *replaced*:
//   total' = total − previousScore + newScore
//   counts' = counts − previousOutcome + newOutcome
// so re-scoring is safe and a late answer corrects the earlier verdict.
// Not answering is a `wrong` outcome (it used to be recorded as nothing).

export type Outcome = 'correct' | 'wrong'

export type QuestionResult = { score: number; outcome: Outcome }

export function applyQuestionResults(opts: {
  results: Record<string, QuestionResult>
  prevScores: Record<string, number>
  prevOutcomes: Record<string, Outcome>
  totals: Record<string, number>
  correctCount: Record<string, number>
  wrongCount: Record<string, number>
}): {
  totals: Record<string, number>
  correctCount: Record<string, number>
  wrongCount: Record<string, number>
} {
  const { results, prevScores, prevOutcomes, totals, correctCount, wrongCount } = opts
  const out = {
    totals: {} as Record<string, number>,
    correctCount: {} as Record<string, number>,
    wrongCount: {} as Record<string, number>,
  }
  for (const [key, r] of Object.entries(results)) {
    out.totals[key] = (totals[key] ?? 0) - (prevScores[key] ?? 0) + r.score
    const prev = prevOutcomes[key]
    out.correctCount[key] =
      (correctCount[key] ?? 0) - (prev === 'correct' ? 1 : 0) + (r.outcome === 'correct' ? 1 : 0)
    out.wrongCount[key] =
      (wrongCount[key] ?? 0) - (prev === 'wrong' ? 1 : 0) + (r.outcome === 'wrong' ? 1 : 0)
  }
  return out
}
