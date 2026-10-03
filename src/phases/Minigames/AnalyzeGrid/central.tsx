import { CentralTeamProgress } from '@/components/CentralTeamProgress'
import type { Phase } from '@helden-inc/tg-schema'

import { useAnalyzeRoster, useAnalyzeSubmitted } from './status'

// Central view for analyze_grid: title + instruction + bare submitted count.
// Nameless on purpose — per-team rows stay on the host screen; the wall only
// needs "how far along is the room" while the timer runs. (The player writes
// a raw set(), not submitAnswer, so aggregates/answeredCount never moves for
// this template — the answer-node read above is the source of truth.)
export function CentralAnalyzeGrid({
  sessionId,
  phase,
}: {
  sessionId: string
  phase: Phase
  config?: unknown
}) {
  const roster = useAnalyzeRoster(sessionId, phase)
  const submitted = useAnalyzeSubmitted(sessionId, roster, phase.id)

  return (
    <CentralTeamProgress
      rows={roster.map((r) => ({
        id: r.key,
        label: r.label,
        pct: submitted[r.writerId] ? 100 : 0,
      }))}
    />
  )
}
