import type { Phase } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'
import { CentralCodePiece, HostCodePiece } from './monitor'
import { CodePiecePlayer } from './player'

// Player (with a resolvable identity) -> their own fragment. Central -> the
// big-screen read-only view. Everyone else (host, or a player with no
// teamId/playerId yet) -> the embedded host monitor. Unlike CodeInput/
// SortOrder, every team member participates here (no leader/member
// asymmetry) — PhaseRouter only redirects to TeamFocusLeader for
// team_leader_only, and this phase deliberately leaves `teamMode` unset in
// its config for exactly that reason.
export function CodePieceRenderer({
  phase,
  sessionId,
  role,
  playerId,
  teamId,
}: {
  phase: Phase
  sessionId: string
  role: Role
  playerId?: string
  teamId?: string
}) {
  if (phase.content.type !== 'codepiece') return null
  const content = phase.content

  if (role === 'player' && playerId) {
    return (
      <CodePiecePlayer
        content={content}
        phaseId={phase.id}
        sessionId={sessionId}
        playerId={playerId}
        teamId={teamId}
        title={phase.title}
      />
    )
  }
  if (role === 'central') return <CentralCodePiece sessionId={sessionId} phase={phase} />
  return <HostCodePiece sessionId={sessionId} phase={phase} />
}
