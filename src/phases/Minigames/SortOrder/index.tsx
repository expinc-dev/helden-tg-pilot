import { TeamFocusLeader } from '../../TeamFocusLeader'
import type { MinigameRendererProps } from '../types'
import { CentralSortOrder } from './central'
import { HostSortOrder } from './host'
import { SortOrderPlayerActive } from './player'
import type { SortOrderConfig } from './score'

// sort_order template (BLUEPRINT_runtime §9 v1). Player arranges labelled items
// into the correctOrder set by the author. Scored on exact-match correctness +
// speed (via ScoringConfig.speedBonus at the phase level, applied by
// scorePhase — this template only returns the correctness signal).
//
// Team mode: only the team leader plays; members see a "focus on the leader"
// screen. Submissions are locked once written (server-side would need rules to
// enforce; UI enforces client-side).
export function SortOrderRenderer(props: MinigameRendererProps<SortOrderConfig>) {
  const { config, phase, sessionId, playerId, role, teamRole } = props

  if (role === 'central') return <CentralSortOrder sessionId={sessionId} phase={phase} />
  if (role === 'host') return <HostSortOrder sessionId={sessionId} phase={phase} />

  // Router already gates team_leader_only + member (via TeamFocusLeader before
  // reaching here). Sort_order additionally treats team_collaborative + member
  // the same way — only the leader plays in EITHER team mode.
  if (teamRole === 'member') return <TeamFocusLeader phaseId={phase.id} />
  if (!playerId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center text-white/60">
        <p className="text-sm">Menunggu identitas pemain…</p>
      </div>
    )
  }
  return (
    <SortOrderPlayerActive
      title={phase.title}
      config={config}
      phaseId={phase.id}
      sessionId={sessionId}
      writerId={playerId}
    />
  )
}
