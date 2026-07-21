import { z } from 'zod'

import type { CorrectnessSignal, MinigameScorerArgs } from '../types'

// Config schema + pure scorer for sort_order. Split from the renderer so the
// self-check can run without pulling React/Firebase into the import graph.

export const sortOrderConfigSchema = z.object({
  items: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
  correctOrder: z.array(z.string()).min(2),
})
export type SortOrderConfig = z.infer<typeof sortOrderConfigSchema>

// Exact-match correctness on the ordered id list. Partial credit not modelled
// in v1 (blueprint §9 says "correctness + speed", not N-of-M). Clock skew on
// answerSubmittedAt is clamped to 0 so a stale device can't earn negative time.
export function scoreSortOrder(args: MinigameScorerArgs<SortOrderConfig>): CorrectnessSignal {
  const { config, answer, answerSubmittedAt, phaseStartMs } = args
  if (!Array.isArray(answer)) return { correct: false, answered: false, elapsedMs: 0 }
  const ids = answer.filter((v) => typeof v === 'string') as string[]
  const answered = ids.length === config.items.length
  const correct =
    answered &&
    ids.length === config.correctOrder.length &&
    ids.every((id, i) => id === config.correctOrder[i])
  const elapsedMs =
    answerSubmittedAt && answerSubmittedAt > phaseStartMs ? answerSubmittedAt - phaseStartMs : 0
  return { correct, answered, elapsedMs }
}
