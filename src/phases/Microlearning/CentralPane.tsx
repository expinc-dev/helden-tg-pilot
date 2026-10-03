import { CentralOverallProgress } from '@/components/CentralOverallProgress'
import { CentralQuestionWall } from '@/components/CentralQuestionWall'
import type { MicrolearningContent, Phase } from '@helden-inc/tg-schema'

import { useAnsweredCount } from '@/phases/Quiz/lib'

import { renderPromptBlocks } from '@/lib/richText'
import { usePlayerBoard } from '@/lib/sync/usePlayerStep'
import { usePresenceCounts } from '@/lib/sync/useSession'
import { useTimer } from '@/lib/sync/useTimer'

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
  const { players: connectedPlayers } = usePresenceCounts(sessionId)
  const timer = useTimer(sessionId, phase)

  const total = content.steps.length
  const counts = new Map<number, number>()
  for (const r of rows) {
    if (!r.connected) continue
    const s = Math.min(Math.max(r.selfStep, 0), total - 1)
    counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  let stepIndex = 0
  let best = -1
  for (const [s, n] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
    if (n > best) {
      best = n
      stepIndex = s
    }
  }

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

  // Late in the phase (≥76% of the room done — Figma "76–102") the wall gives
  // way to the overall-progress screen.
  const finished = rows.filter((r) => r.connected && r.selfStep >= total).length
  if (connectedPlayers > 0 && (finished / connectedPlayers) * 100 >= 76) {
    return <CentralOverallProgress finished={finished} total={connectedPlayers} />
  }

  return (
    <CentralQuestionWall
      prompt={prompt}
      timer={{ ...timer, active: timerVisible }}
      answered={questionIndex >= 0 ? answered : undefined}
      total={connectedPlayers}
    />
  )
}
