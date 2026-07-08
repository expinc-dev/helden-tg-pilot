import type { Phase } from '@helden-inc/tg-schema'

import type { Role } from './PhaseRouter'

export function IdleRenderer({ phase, role }: { phase: Phase & { type: 'idle' }; role: Role }) {
  const caption = phase.content.type === 'idle' ? phase.content.caption : null
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16">
      <div className="text-4xl">💤</div>
      <p className="text-lg">{caption ?? 'Waiting…'}</p>
      <p className="text-xs text-gray-400">
        {role} · {phase.id}
      </p>
    </div>
  )
}
