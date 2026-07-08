import type { IdleContent } from '@helden-inc/tg-schema'

import type { Role } from './PhaseRouter'

export function IdleRenderer({
  content,
  role,
  phaseId,
}: {
  content: IdleContent
  role: Role
  phaseId: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16">
      <div className="text-4xl">💤</div>
      <p className="text-lg">{content.caption ?? 'Waiting…'}</p>
      <p className="text-xs text-gray-400">
        {role} · {phaseId}
      </p>
    </div>
  )
}
