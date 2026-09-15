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

// ── Wire format ─────────────────────────────────────────────────────────────
// The scorer reads `players/{id}/answers/{phaseId}.value`, which the player
// writes as an ENVELOPE (see AnalyzeGrid/player.tsx):
//
//   { gate: ['B/Thu', 'D/Tue'], questions: [{...}, ...] }
//
// `gate` holds the marked cells as "row/col" strings — NOT {row, col} objects.
// The reader below is deliberately tolerant so the gate keeps scoring across
// formats we have already shipped or may reuse in preview/durable paths:
//   • envelope  { gate: [...] }         ← current player write
//   • bare array [...]                  ← legacy / migration safety
//   • entries as "row/col" strings      ← current player write
//   • entries as { row, col } objects   ← config-shaped / legacy
//
// Canonicalising BOTH sides to a Set of "row/col" keys makes the comparison
// order-independent and immune to duplicate marks (set semantics, not list).
type AnalyzeGridMark = string | { row: string; col: string }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function cellKey(mark: unknown): string | null {
  if (typeof mark === 'string') {
    const s = mark.trim()
    return s === '' ? null : s
  }
  const m = mark as { row?: unknown; col?: unknown }
  if (typeof m?.row === 'string' && typeof m?.col === 'string') return `${m.row}/${m.col}`
  return null
}

// Unwrap the envelope (or accept a bare array), then canonicalise every entry.
// Returns null when nothing usable was submitted at all.
function markedKeys(answer: unknown): Set<string> | null {
  const raw: unknown = isRecord(answer) && Array.isArray(answer.gate) ? answer.gate : answer
  if (!Array.isArray(raw)) return null
  const keys = new Set<string>()
  for (const entry of raw as AnalyzeGridMark[]) {
    const key = cellKey(entry)
    if (key) keys.add(key)
  }
  return keys.size ? keys : null
}

// Single source of truth for "does this mark set match the key". The player's
// live gate (AnalyzeGrid/player.tsx) calls this directly instead of keeping its
// own copy of the comparison, so the UI gate and the flushed score can never
// disagree. Exact set-equality: order independent, extra/missing marks fail.
export function isAnalyzeGridGateCorrect(config: AnalyzeGridConfig, marks: unknown): boolean {
  const marked = markedKeys(marks)
  if (!marked) return false
  const key = new Set(config.emptyCells.map((c) => `${c.row}/${c.col}`))
  return marked.size === key.size && [...key].every((k) => marked.has(k))
}

// Exact set-equality on the marked empty cells. Order independent; extra marks
// (more cells than key) or missing marks → incorrect. Only the gate has a
// correctness signal — the analysis questions after it are ungraded
// single_choice reuse (microlearning has no scoring path), so the minigame's
// scorer reports on the gate itself.
export function scoreAnalyzeGrid(args: MinigameScorerArgs<AnalyzeGridConfig>): CorrectnessSignal {
  const { config, answer, answerSubmittedAt, phaseStartMs } = args

  const marked = markedKeys(answer)
  // `answered` follows the original contract: a full-sized mark set was sent,
  // regardless of whether it matched the key.
  const answered = marked !== null && marked.size === config.emptyCells.length
  const correct = isAnalyzeGridGateCorrect(config, answer)
  const elapsedMs =
    answerSubmittedAt && answerSubmittedAt > phaseStartMs ? answerSubmittedAt - phaseStartMs : 0
  return { correct, answered, elapsedMs }
}
