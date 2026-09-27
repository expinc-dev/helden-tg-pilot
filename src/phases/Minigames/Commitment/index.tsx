import { TeamFocusLeader } from '../../TeamFocusLeader'
import type { MinigameRendererProps } from '../types'
import { CommitmentCentral } from './central'
import { CommitmentPlayer } from './player'
import type { CommitmentConfig } from './score'

// commitment template (HLN-014) — the closing commitment.
//
// Branch order mirrors FormToPrompt: role first (host/central never have a team
// role), then the team gate, then the missing-identity guard, then the player.
// `teamMode: individual` in the CMS, so the member branch is dead code today —
// it stays because team mode is a per-phase CMS setting, and a phase flipped to
// a team mode later must not drop a member into a form whose answer node only
// one of them could write.
//
// The host returns null on purpose, same as form_to_prompt. The host shell
// already carries the title, timer and advance control; the neutral count is on
// the central screen so the host can read it from the wall. A second roster here
// would duplicate that count and put names next to it — and the one thing this
// phase must never do is show who wrote what.
export function CommitmentRenderer(props: MinigameRendererProps<CommitmentConfig>) {
  const { config, phase, sessionId, playerId, role, teamRole } = props

  if (role === 'central') {
    return <CommitmentCentral sessionId={sessionId} phase={phase} config={config} />
  }
  if (role === 'host') return null

  if (teamRole === 'member') return <TeamFocusLeader phaseId={phase.id} />

  if (!playerId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center text-white/60">
        <p className="text-sm">Menunggu identitas pemain…</p>
      </div>
    )
  }

  return (
    <CommitmentPlayer phase={phase} sessionId={sessionId} writerId={playerId} config={config} />
  )
}
