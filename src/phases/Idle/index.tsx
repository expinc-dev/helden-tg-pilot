import type { IdleContent } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'
import { CentralIdleScreen } from './central'
import { HostIdleScreen } from './host'
import { PlayerIdleScreen } from './player'

export function IdleRenderer({
  content,
  role,
  phaseId,
  sessionId,
  playerId,
  allowTeams,
  onAdvance,
}: {
  content: IdleContent
  role: Role
  phaseId: string
  sessionId: string
  playerId?: string
  allowTeams?: boolean
  onAdvance?: () => void
}) {
  if (role === 'central') {
    return <CentralIdleScreen sessionId={sessionId} />
  }

  if (role === 'player') {
    return <PlayerIdleScreen sessionId={sessionId} playerId={playerId} allowTeams={allowTeams} />
  }

  if (role === 'host') {
    return <HostIdleScreen sessionId={sessionId} allowTeams={allowTeams} onAdvance={onAdvance} />
  }

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
