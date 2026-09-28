import { TeamFocusLeader } from '../../TeamFocusLeader'
import type { MinigameRendererProps } from '../types'
import { CentralAnalyzeGrid } from './central'
import { HostAnalyzeGrid } from './host'
import { AnalyzeGridPlayer } from './player'
import type { AnalyzeGridConfig } from './score'

// analyze_grid template (HLN-007). Player taps the cells that stayed empty on
// a grid mirroring the physical board, then answers ungraded analysis
// questions. Scored on the gate (exact set-equality of marked empty cells).
// Team mode: only the leader plays — members see the focus screen.
export function AnalyzeGridRenderer(props: MinigameRendererProps<AnalyzeGridConfig>) {
  const { config, phase, sessionId, playerId, role, teamRole } = props

  // Host gets the per-team/per-player submit spread, central the nameless
  // count — previously both returned null, leaving a dark empty band (and on
  // central, a bare dark page) with no in-phase next path.
  if (role === 'central') return <CentralAnalyzeGrid sessionId={sessionId} phase={phase} />
  if (role === 'host')
    return <HostAnalyzeGrid sessionId={sessionId} phase={phase} config={config} />

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
