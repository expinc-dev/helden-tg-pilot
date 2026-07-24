import type { Role } from '../PhaseRouter'
import { CentralReflection } from './central'
import { HostReflection } from './host'
import type { ReflectionContent } from './lib'
import { PlayerReflection } from './player'

export function ReflectionRenderer({
  content,
  title,
  role,
  sessionId,
  phaseId,
  playerId,
}: {
  content: ReflectionContent
  title: string
  role: Role
  sessionId: string
  phaseId: string
  playerId?: string
}) {
  if (role === 'player' && playerId)
    return (
      <PlayerReflection
        content={content}
        title={title}
        sessionId={sessionId}
        phaseId={phaseId}
        playerId={playerId}
      />
    )
  if (role === 'central')
    return <CentralReflection content={content} sessionId={sessionId} phaseId={phaseId} />
  return <HostReflection content={content} sessionId={sessionId} phaseId={phaseId} />
}
