import type { Phase } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'
import { CentralNormalQuiz } from './central'
import { HostNormalQuiz } from './host'
import type { NormalQuizContent } from './lib'
import { PlayerNormalQuiz } from './player'

export function NormalQuizRenderer({
  content,
  role,
  sessionId,
  playerId,
  phase,
  onAdvance,
}: {
  content: NormalQuizContent
  role: Role
  sessionId: string
  playerId?: string
  phase: Phase
  onAdvance?: () => void
}) {
  if (role === 'player' && playerId)
    return (
      <PlayerNormalQuiz content={content} sessionId={sessionId} playerId={playerId} phase={phase} />
    )
  if (role === 'central')
    return <CentralNormalQuiz content={content} sessionId={sessionId} phase={phase} />
  return (
    <HostNormalQuiz content={content} sessionId={sessionId} phase={phase} onAdvance={onAdvance} />
  )
}
