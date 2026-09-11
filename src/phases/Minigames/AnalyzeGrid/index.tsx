import { TeamFocusLeader } from '../../TeamFocusLeader'
import type { MinigameRendererProps } from '../types'
import { AnalyzeGridPlayer } from './player'
import type { AnalyzeGridConfig } from './score'

// analyze_grid template (HLN-007). Player taps the cells that stayed empty on
// a grid mirroring the physical board, then answers ungraded analysis
// questions. Scored on the gate (exact set-equality of marked empty cells).
// Team mode: only the leader plays — members see the focus screen.
export function AnalyzeGridRenderer(props: MinigameRendererProps<AnalyzeGridConfig>) {
  const { config, phase, sessionId, playerId, role, teamRole } = props

  if (role === 'central' || role === 'host') {
    // No dedicated central/host view for v1 — the host shell shows the phase
    // title + timer + advance controls. The gate + questions are leader-side.
    return null
  }

  if (teamRole === 'member') return <TeamFocusLeader phaseId={phase.id} />
  if (!playerId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center text-white/60">
        <p className="text-sm">Menunggu identitas pemain…</p>
      </div>
    )
  }
  return (
    <AnalyzeGridPlayer phase={phase} config={config} sessionId={sessionId} writerId={playerId} />
  )
}
