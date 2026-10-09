import { CentralTeamProgress } from '@/components/CentralTeamProgress'
import type { Phase } from '@helden-inc/tg-schema'

import { useAnalyzeRoster, useAnalyzeSubmitted } from '../AnalyzeGrid/status'
import type { DoubtSeedConfig } from './score'

// Central view for doubt_seed: "Kemajuan Tim" only. The teams' own card
// arrangements are NOT shown on the wall — they stay on the host's device (see
// host.tsx) — so the room just sees how many teams have sent their version.
// Same roster + submitted-or-not reads as analyze_grid: one row per team in
// team modes (the leader's answer node), per player otherwise.
export function DoubtSeedCentral({
  sessionId,
  phase,
}: {
  sessionId: string
  phase: Phase
  config?: DoubtSeedConfig
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
