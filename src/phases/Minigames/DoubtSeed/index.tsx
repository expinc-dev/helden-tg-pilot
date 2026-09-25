import { TeamFocusLeader } from '../../TeamFocusLeader'
import type { MinigameRendererProps } from '../types'
import { DoubtSeedCentral } from './central'
import { DoubtSeedPlayer } from './player'
import type { DoubtSeedConfig } from './score'

// doubt_seed template (HLN-006). Reflection activity — players drag soul cards
// (and avoid generic distractors) into drop zones; no scoring. Team
// collaborative: in v1 the leader drives and members see the focus screen,
// pending PM confirmation of the sync model (see todo).
//
// The central renders the anonymous gallery instead of the board (HLN-003):
// the generic AI version next to the teams' own versions, no names.
export function DoubtSeedRenderer(props: MinigameRendererProps<DoubtSeedConfig>) {
  const { config, phase, sessionId, playerId, role, teamRole } = props

  if (role === 'host') return null
  if (role === 'central') {
    return <DoubtSeedCentral sessionId={sessionId} phase={phase} config={config} />
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
    <DoubtSeedPlayer
      phase={phase}
      sessionId={sessionId}
      writerId={playerId}
      soulCards={config.soulCards}
      distractorCards={config.distractorCards}
      dropZones={config.dropZones}
      instructions={config.instructions}
    />
  )
}
