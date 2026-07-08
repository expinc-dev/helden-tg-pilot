import type { Phase } from '@helden-inc/tg-schema'

import { IdleRenderer } from './Idle'
import { MicrolearningRenderer } from './Microlearning'

export type Role = 'host' | 'central' | 'player'

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
  switch (phase.type) {
    case 'idle':
      return <IdleRenderer phase={phase} role={role} />
    case 'microlearning':
      return (
        <MicrolearningRenderer
          phase={phase}
          role={role}
          sessionId={sessionId}
          playerId={playerId}
        />
      )
    default:
      return (
        <div className="p-8 text-sm text-gray-500">
          Phase type "{phase.type}" not renderable yet.
        </div>
      )
  }
}
