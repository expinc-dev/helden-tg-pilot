import type { Phase } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'
import { CentralQuiz } from './central'
import { HostQuiz } from './host'
import type { QuizContent } from './lib'
import { PlayerQuiz } from './player'

export function QuizRenderer({
  content,
  role,
  sessionId,
  phaseId,
  playerId,
  teamId,
  phase,
}: {
  content: QuizContent
  role: Role
  sessionId: string
  phaseId: string
  playerId?: string
  teamId?: string
  phase: Phase
}) {
  if (role === 'player')
    return (
      <PlayerQuiz
        content={content}
        sessionId={sessionId}
        phaseId={phaseId}
        playerId={playerId!}
        teamId={teamId}
        phase={phase}
      />
    )
  if (role === 'central')
    return <CentralQuiz content={content} sessionId={sessionId} phaseId={phaseId} phase={phase} />
  return <HostQuiz content={content} sessionId={sessionId} phaseId={phaseId} phase={phase} />
}
