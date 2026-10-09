// Pure "level bundle" grouping for the central Kemajuan board. The schema has no
// bundle/group field: Level 3A/3B/3C are three separate quiz phases that only
// share a title prefix ("Level 3A: …"). This reads that prefix so the board can
// draw ONE bar per team with one block per phase instead of one block per
// question. No Firebase/React: `checks/phases/quiz/bundleGroup.selfcheck.ts`
// runs under tsx.
import type { QuestionOutcome } from './outcomes'

// Levels whose lettered phases are drawn as a single combined bar. Level 1/2
// keep the per-question blocks on purpose.
export const BUNDLED_LEVELS: readonly string[] = ['3']

export type PhaseLike = {
  id: string
  type: string
  title?: string
  content?: unknown
}

export type BundleBlock = { phaseId: string; label: string; qIds: string[] }

type TeamOutcome = 'correct' | 'wrong'
// aggregates/questionOutcome: questionId -> teamId (or playerId) -> verdict.
export type OutcomeMap = Record<string, Record<string, TeamOutcome> | undefined>

const TITLE_RE = /^Level (\d+)([A-Z])\b/

function parseTitle(title: string | undefined): { level: string; label: string } | null {
  const m = title ? TITLE_RE.exec(title) : null
  return m ? { level: m[1], label: `${m[1]}${m[2]}` } : null
}

function questionCount(phase: PhaseLike): number {
  const qs = (phase.content as { questions?: unknown[] } | undefined)?.questions
  return Array.isArray(qs) ? qs.length : 0
}

// Blocks for the bundle `phase` belongs to, in phaseOrder; null when `phase` is
// not part of a bundled level (caller keeps the per-question blocks).
// A bundle = consecutive quiz phases in phaseOrder sharing the same level number.
export function levelBundleOf(
  phaseOrder: readonly string[],
  phases: Record<string, PhaseLike | undefined>,
  phase: PhaseLike
): BundleBlock[] | null {
  const self = parseTitle(phase.title)
  if (!self || phase.type !== 'quiz' || !BUNDLED_LEVELS.includes(self.level)) return null

  const at = phaseOrder.indexOf(phase.id)
  if (at < 0) return null
  const inBundle = (id: string) => {
    const p = phases[id]
    return !!p && p.type === 'quiz' && parseTitle(p.title)?.level === self.level
  }

  let start = at
  while (start > 0 && inBundle(phaseOrder[start - 1])) start--
  let end = at
  while (end < phaseOrder.length - 1 && inBundle(phaseOrder[end + 1])) end++

  const blocks: BundleBlock[] = []
  for (let i = start; i <= end; i++) {
    const p = phases[phaseOrder[i]]!
    const n = Math.max(1, questionCount(p))
    blocks.push({
      phaseId: p.id,
      label: parseTitle(p.title)!.label,
      qIds: Array.from({ length: n }, (_, q) => `${p.id}_q${q}`),
    })
  }
  return blocks
}

// One verdict per block for one team. A block is `pending` until every one of
// its questions has been scored; any wrong question makes the block wrong.
export function bundleOutcomes(
  blocks: BundleBlock[],
  id: string,
  outcomes: OutcomeMap
): QuestionOutcome[] {
  return blocks.map((b) => {
    const verdicts = b.qIds.map((q) => outcomes[q]?.[id])
    if (verdicts.includes('wrong')) return 'wrong'
    return verdicts.every((v) => v === 'correct') ? 'correct' : 'pending'
  })
}
