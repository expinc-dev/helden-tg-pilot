import { z } from 'zod'

import type { CorrectnessSignal, MinigameScorerArgs } from '../types'

// Config schema + pure scorer for analyze_grid. Split from the renderer so the
// self-check can run without pulling React/Firebase into the import graph.
// Mirrors the CMS's templates/analyzeGrid.ts intentionally (duplicated, not
// imported — tg-schema's MiniGameContent.config is deliberately loose).
export const analyzeGridConfigSchema = z.object({
  gridRows: z.number().int().min(1),
  gridCols: z.number().int().min(1),
  rowLabels: z.array(z.string()).min(1),
  colLabels: z.array(z.string()).min(1),
  emptyCells: z.array(z.object({ row: z.string(), col: z.string() })).min(1),
  successMessage: z.string(),
  analysisQuestions: z.array(z.record(z.string(), z.unknown())).min(1),
})
export type AnalyzeGridConfig = z.infer<typeof analyzeGridConfigSchema>

// Exact set-equality on the marked empty cells. Order independent; extra marks
// (more cells than key) or missing marks → incorrect. Only the gate has a
// correctness signal — the analysis questions after it are ungraded
// single_choice reuse (microlearning has no scoring path), so the minigame's
// scorer reports on the gate itself.
export function scoreAnalyzeGrid(args: MinigameScorerArgs<AnalyzeGridConfig>): CorrectnessSignal {
  const { config, answer, answerSubmittedAt, phaseStartMs } = args
  if (!Array.isArray(answer) || answer.length === 0) {
    return { correct: false, answered: false, elapsedMs: 0 }
  }
  const marked = (answer as Array<{ row?: string; col?: string }>).filter(
    (c) => typeof c?.row === 'string' && typeof c?.col === 'string'
  )
  const answered = marked.length === config.emptyCells.length
  const keyKey = config.emptyCells
    .map((c) => `${c.row}/${c.col}`)
    .sort()
    .join('|')
  const markedKey = marked
    .map((c) => `${c.row}/${c.col}`)
    .sort()
    .join('|')
  const correct = answered && markedKey === keyKey
  const elapsedMs =
    answerSubmittedAt && answerSubmittedAt > phaseStartMs ? answerSubmittedAt - phaseStartMs : 0
  return { correct, answered, elapsedMs }
}
