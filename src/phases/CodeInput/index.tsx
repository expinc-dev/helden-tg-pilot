import type { Phase } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'
import { CentralCodeInput, HostCodeInput } from './monitor'
import { CodeInputPlayer } from './player'

// Player → interactive puzzle, team-scoped when teamId is given, room-scoped
// (shared by everyone) otherwise. Central → big-screen read-only view. Host
// → embedded read-only monitor of every team's progress, or a single
// room-wide row when team mode is off.
export function TeamCodeInput({
  phase,
  phaseStartMs,
  sessionId,
  role,
  teamId,
  allowTeams,
}: {
  phase: Phase
  phaseStartMs?: number
  sessionId: string
  role: Role
  teamId?: string
  allowTeams?: boolean
}) {
  if (phase.content.type !== 'codeinput') return null
  const content = phase.content
  if (role === 'central') {
    return (
      <CentralCodeInput
        sessionId={sessionId}
        phase={phase}
        phaseStartMs={phaseStartMs}
        allowTeams={!!allowTeams}
      />
    )
  }
  if (role !== 'player') {
    return (
      <HostCodeInput
        sessionId={sessionId}
        phase={phase}
        phaseStartMs={phaseStartMs}
        allowTeams={!!allowTeams}
      />
    )
  }
  // Team mode but this player hasn't joined a team yet (e.g. joined after the
  // host already started the phase) — never treat them as room-scoped, that
  // would put their guesses/attempts into the wrong (shared-by-everyone) node.
  if (allowTeams && !teamId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center text-white/60">
        <p className="text-sm">Join a team to play this puzzle.</p>
      </div>
    )
  }
  return (
    <CodeInputPlayer
      content={content}
      phase={phase}
      phaseStartMs={phaseStartMs}
      sessionId={sessionId}
      teamId={teamId}
    />
  )
}
