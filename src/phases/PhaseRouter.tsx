import type { Phase } from '@helden-inc/tg-schema'

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
}: {
  phase: Phase
  role: Role
  sessionId: string
  playerId?: string
}) {
  const content = phase.content
  switch (content.type) {
    case 'idle':
      return <IdleRenderer content={content} role={role} phaseId={phase.id} />
    case 'microlearning':
      return (
        <MicrolearningRenderer
          content={content}
          title={phase.title}
          role={role}
          sessionId={sessionId}
          playerId={playerId}
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
