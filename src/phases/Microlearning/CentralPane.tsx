import { CentralOverallProgress } from '@/components/CentralOverallProgress'
import { CentralQuestionWall } from '@/components/CentralQuestionWall'
import type { MicrolearningContent, Phase } from '@helden-inc/tg-schema'

import { useAnsweredCount, useTotalPlayers } from '@/phases/Quiz/lib'

import { renderPromptBlocks } from '@/lib/richText'
import { usePlayerBoard } from '@/lib/sync/usePlayerStep'
import { useTeams } from '@/lib/sync/useTeams'
import { useTimer } from '@/lib/sync/useTimer'

import { pickCentralStep, roomProgress } from './progress'

// ─── Central: the question the room is on + how many have answered ──────────
// Self-paced phase, so players sit on different steps; the wall follows the
// step most connected players are currently on (ties go to the earlier step,
// everyone finished → the last step). Nameless by design — public screen.
export function CentralProgressPane({
  content,
  title,
  sessionId,
  phase,
}: {
  content: MicrolearningContent
  title: string
  sessionId: string
  phase: Phase
}) {
  const rows = usePlayerBoard(sessionId, phase.id)
  const joinedPlayers = useTotalPlayers(sessionId)
  const leaderIds = useTeams(sessionId).map((t) => t.ownerPlayerId)
  const timer = useTimer(sessionId, phase)

  const total = content.steps.length
  // The wall follows where the WORKING players are (leaders only in leader-only
  // phases), counts every joined player — online or not — and breaks a tie toward
  // the later step so a question never hides behind the intro while someone is
  // already answering it.
  const stepIndex = pickCentralStep({
    players: rows,
    total,
    teamMode: phase.teamMode,
    leaderIds,
  })

  const step = content.steps[stepIndex]
  const questionIndex = step.blocks.findIndex((b) => b.kind === 'question')
  const questionBlock = questionIndex >= 0 ? step.blocks[questionIndex] : undefined
  const prompt =
    questionBlock && questionBlock.kind === 'question'
      ? renderPromptBlocks(questionBlock.question.prompt)
      : (step.title ?? title)

  const answered = useAnsweredCount(
    sessionId,
    questionIndex >= 0 ? `${phase.id}_${step.id}_${questionIndex}` : '_none'
  )

  const timerVisible = timer.active && (phase.timer?.visibleTo ?? []).includes('central')

  // Late in the phase (>=76% of the room done — Figma "76–102") the wall gives
  // way to the overall-progress screen.
  const { finished, roomSize } = roomProgress({
    players: rows,
    total,
    joined: joinedPlayers,
    teamMode: phase.teamMode,
    leaderIds,
  })
  if (roomSize > 0 && (finished / roomSize) * 100 >= 76) {
    return <CentralOverallProgress finished={finished} total={roomSize} />
  }

  return (
    <CentralQuestionWall
      prompt={prompt}
      timer={{ ...timer, active: timerVisible }}
      answered={questionIndex >= 0 ? answered : undefined}
      total={Math.max(joinedPlayers, answered)}
    />
  )
}
