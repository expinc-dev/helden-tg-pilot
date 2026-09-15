import { useMyTeamId } from '@/lib/sync/useTeams'

import { TeamFocusLeader } from '../../TeamFocusLeader'
import type { MinigameRendererProps } from '../types'
import { TeamSelfieCentral } from './central'
import { TeamSelfiePlayer } from './player'
import type { TeamSelfieConfig } from './score'

// team_selfie template (HLN-018). Closing activity: each team captures one
// selfie; the central screen shows the mosaic live with the closing line
// overlaid. No names anywhere.
//
// Team mode is leader-drives (v1), the same model as sort_order / analyze_grid
// / doubt_seed. That is not arbitrary: one photo per team is stored at a single
// key, so two members shooting at once would just overwrite each other, and the
// `selfies` rules in database.rules.json authorise exactly one writer per team
// (the leader, via teams/{teamId}/ownerPlayerId). Letting members render the
// camera would produce a UI whose only possible outcome is a denied write.
export function TeamSelfieRenderer(props: MinigameRendererProps<TeamSelfieConfig>) {
  const { config, phase, sessionId, playerId, role, teamRole } = props
  // teamId is not part of MinigameRendererProps, so resolve it here — same
  // source of truth the team gate uses.
  const teamId = useMyTeamId(sessionId, playerId ?? '')

  if (role === 'central') {
    return <TeamSelfieCentral sessionId={sessionId} phase={phase} config={config} />
  }
  // The host shell shows the phase title, timer and advance controls; the
  // gallery belongs on the central screen, so host renders nothing extra.
  if (role === 'host') return null

  if (teamRole === 'member') return <TeamFocusLeader phaseId={phase.id} />

  if (!playerId) {
    return (
      <div className="bg-helden-base flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center text-white/60">
        <p className="text-sm">Menunggu identitas pemain…</p>
      </div>
    )
  }

  return (
    <TeamSelfiePlayer
      phase={phase}
      config={config}
      sessionId={sessionId}
      playerId={playerId}
      teamId={teamId}
    />
  )
}
