import type { VideoContent } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'
import { CentralVideo } from './central'
import { HostVideo } from './host'
import { PlayerFoldIn } from './player'

export { VideoHostScreen } from './host'

export function VideoRenderer({
  content,
  role,
  sessionId,
  title,
  playerId,
  allowTeams,
}: {
  content: VideoContent
  role: Role
  sessionId: string
  title: string
  playerId?: string
  allowTeams?: boolean
}) {
  if (role === 'player') {
    return <PlayerFoldIn sessionId={sessionId} playerId={playerId} allowTeams={allowTeams} />
  }
  if (role === 'central') {
    return <CentralVideo content={content} sessionId={sessionId} />
  }
  return <HostVideo content={content} sessionId={sessionId} title={title} />
}
