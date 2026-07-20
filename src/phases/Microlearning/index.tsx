import type { MicrolearningContent, Phase } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'
import { CentralProgressPane } from './CentralPane'
import { MonitorPane } from './HostPane'
import { PlayerPane } from './PlayerPane'

export function MicrolearningRenderer({
  content,
  title,
  role,
  sessionId,
  playerId,
  phase,
  onAdvance,
}: {
  content: MicrolearningContent
  title: string
  role: Role
  sessionId: string
  playerId?: string
  phase: Phase
  onAdvance?: () => void
}) {
  if (role === 'player' && playerId)
    return <PlayerPane content={content} sessionId={sessionId} playerId={playerId} phase={phase} />
  // Central is a public-facing screen — a lighter, nameless aggregate, and only
  // when this phase actually wants one (host already gets the full per-player
  // spread from HostPresenceSpread, rendered by the host page itself).
  if (role === 'central')
    return <CentralProgressPane content={content} title={title} sessionId={sessionId} />
  return <MonitorPane content={content} title={title} sessionId={sessionId} onAdvance={onAdvance} />
}
