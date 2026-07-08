import type { Phase } from '@helden-inc/tg-schema'
import { IdleRenderer } from './Idle'
import { MicrolearningRenderer } from './Microlearning'

export type Role = 'host' | 'central' | 'player'

export function PhaseRouter({ phase, role }: { phase: Phase; role: Role }) {
  switch (phase.type) {
    case 'idle':
      return <IdleRenderer phase={phase} role={role} />
    case 'microlearning':
      return <MicrolearningRenderer phase={phase} role={role} />
    default:
      return <Unsupported type={phase.type} />
  }
}

function Unsupported({ type }: { type: string }) {
  return <div className="p-8 text-sm text-gray-500">Phase type "{type}" not renderable yet — update the app.</div>
}
