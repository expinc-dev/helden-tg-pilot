import type { Phase } from '@helden-inc/tg-schema'

import { TeamCodeInput } from './CodeInput'
import { IdleRenderer } from './Idle'
import { MicrolearningRenderer } from './Microlearning'

export type Role = 'host' | 'central' | 'player'

// Discriminate on phase.content (the real discriminated union). phase.type is a
// plain enum, independent of content in the schema — switching on it does not
// narrow content, so we switch on content.type and pass the narrowed content down.
export function PhaseRouter({
  phase,
  role,
  sessionId,
  playerId,
  allowTeams,
  teamId,
}: {
  phase: Phase
  role: Role
  sessionId: string
  playerId?: string
  allowTeams?: boolean
  teamId?: string
}) {
  const content = phase.content
  switch (content.type) {
    case 'idle':
      return <IdleRenderer content={content} role={role} phaseId={phase.id} />
    case 'codeinput':
      // Team-aware page: only in team mode. Otherwise fall through to the
      // "not renderable yet" default (single-player codeinput isn't built).
      return allowTeams ? (
        <TeamCodeInput
          content={content}
          phaseId={phase.id}
          sessionId={sessionId}
          role={role}
          teamId={teamId}
        />
      ) : (
        <div className="p-8 text-sm text-gray-500">Code input needs Team Mode enabled.</div>
      )
    case 'microlearning':
      return (
        <MicrolearningRenderer
          content={content}
          title={phase.title}
          role={role}
          sessionId={sessionId}
          playerId={playerId}
          phase={phase}
        />
      )
    default:
      return (
        <div className="p-8 text-sm text-gray-500">
          Phase type "{content.type}" not renderable yet.
        </div>
      )
  }
}
