import { TeamFocusLeader } from '../../TeamFocusLeader'
import type { MinigameRendererProps } from '../types'
import { FormToPromptCentral } from './central'
import { FormToPromptPlayer } from './player'
import type { FormToPromptConfig } from './score'

// form_to_prompt template (HLN-005) — L4a + L4b.
//
// Branch order mirrors DoubtSeed/TeamSelfie: role first (host/central never have
// a team role), then the team gate, then the missing-identity guard, then the
// player. `teamMode: individual` in the CMS, so the member branch is dead code
// today — it stays because team mode is a per-phase CMS setting, and a phase
// flipped to a team mode later must not drop a member into a form whose answer
// node only one of them could write.
//
// The host returns null on purpose. The storyboard's host job in 4b is rhythm,
// hands-on help ("buka Gemini, paste") and the verbal safety net — the host
// shell already carries the title, timer and advance control, and the NEUTRAL
// progress count is on the central screen precisely so the host can read it
// from the wall (storyboard §4b: "untuk host pantau, netral"). A second roster
// here would duplicate that count and, worse, would put names next to it.
export function FormToPromptRenderer(props: MinigameRendererProps<FormToPromptConfig>) {
  const { config, phase, sessionId, playerId, role, teamRole } = props

  if (role === 'central') {
    return <FormToPromptCentral sessionId={sessionId} phase={phase} config={config} />
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
    <FormToPromptPlayer phase={phase} sessionId={sessionId} writerId={playerId} config={config} />
  )
}
