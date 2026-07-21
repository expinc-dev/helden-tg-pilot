import type { Phase } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'
import { CodeInputMonitor } from './monitor'
import { CodeInputPlayer } from './player'

// Player + teamId → interactive puzzle for that team. Host/central (no teamId) →
// read-only monitor of every team's progress.
export function TeamCodeInput({
  phase,
  phaseStartMs,
  sessionId,
  role,
  teamId,
}: {
  phase: Phase
  phaseStartMs?: number
  sessionId: string
  role: Role
  teamId?: string
}) {
  if (phase.content.type !== 'codeinput') return null
  const content = phase.content
  if (role !== 'player' || !teamId) {
    return <CodeInputMonitor sessionId={sessionId} phase={phase} phaseStartMs={phaseStartMs} />
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
