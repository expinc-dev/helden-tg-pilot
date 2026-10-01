// Pure per-question verdicts for one player, read straight from the answers the
// player wrote — the same source the host's red/green option marks use — so the
// central leaderboard never waits on the host's scoring pass for right/wrong.
// No Firebase/React: `checks/phases/quiz/outcomes.selfcheck.ts` runs under tsx.

export type QuestionOutcome = 'correct' | 'wrong' | 'unanswered' | 'pending'

type AnswerNode = { value?: unknown } | undefined

// `correctId` is stripped from the player-safe bundle but present in the full
// bundle host/central use; read it defensively (not on the schema's Question type).
function correctIdOf(q: unknown): string | undefined {
  if (q && typeof q === 'object' && 'correctId' in q) {
    const id = (q as { correctId?: unknown }).correctId
    return typeof id === 'string' && id.length > 0 ? id : undefined
  }
  return undefined
}

// One entry per question. Questions at index >= revealedCount have not been
// opened to the room yet → 'pending'. Opened ones: no answer → 'unanswered',
// answer equal to the key → 'correct', any other answer → 'wrong'.
export function questionOutcomes(opts: {
  questions: unknown[]
  answers: Record<string, AnswerNode> | undefined
  phaseId: string
  revealedCount: number
}): QuestionOutcome[] {
  const { questions, answers, phaseId, revealedCount } = opts
  return questions.map((q, i) => {
    if (i >= revealedCount) return 'pending'
    const ans = answers?.[`${phaseId}_q${i}`]
    const value = ans?.value
    if (value === undefined || value === null) return 'unanswered'
    const key = correctIdOf(q)
    return key !== undefined && value === key ? 'correct' : 'wrong'
  })
}
