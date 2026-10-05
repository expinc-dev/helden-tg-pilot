import { CentralQuestionWall } from '@/components/CentralQuestionWall'
import type { Phase } from '@helden-inc/tg-schema'

import { renderPromptBlocks } from '@/lib/richText'
import { useQuizStep } from '@/lib/sync/useQuizStep'
import { useTimer } from '@/lib/sync/useTimer'

import {
  type QuizContent,
  questionOptions,
  useAnsweredCount,
  useDistribution,
  useTotalPlayers,
} from '../lib'
import { isScaleQuestion, scaleOptionId, scalePoints } from '../scale'
import { KahootOptions } from './components/KahootOptions'
import { LeaderboardScreen } from './components/LeaderboardScreen'
import { ResultsBoard } from './components/ResultsBoard'

export function CentralQuiz({
  content,
  sessionId,
  phaseId,
  phase,
}: {
  content: QuizContent
  sessionId: string
  phaseId: string
  phase: Phase
}) {
  const { quizStep } = useQuizStep(sessionId)
  const timer = useTimer(sessionId, phase)
  const q = content.questions[quizStep.step]
  const answeredCount = useAnsweredCount(sessionId, `${phaseId}_q${quizStep.step}`)
  const totalPlayers = useTotalPlayers(sessionId)
  const distribution = useDistribution(sessionId, `${phaseId}_q${quizStep.step}`)

  // HLN-012: on_device quizzes are ungraded and single-stage — no leaderboard,
  // no timer, no reveal. Scale questions show the per-point vote count once
  // anyone has voted (counts only, never who voted what).
  const onDevice = content.mode === 'on_device'

  if (!onDevice && quizStep.stage === 'leaderboard') {
    return (
      <LeaderboardScreen
        sessionId={sessionId}
        phase={phase}
        content={content}
        questionId={`${phaseId}_q${quizStep.step}`}
        revealedCount={quizStep.step + 1}
      />
    )
  }

  if (!q) return null

  const text = renderPromptBlocks(q.prompt)

  // Scale statement: question wall until the first vote, then one row per
  // point (circle = the number, endpoint labels on the first/last point).
  if (onDevice) {
    if (isScaleQuestion(q) && answeredCount > 0) {
      // A = strongest agreement, matching the player's lettered rows.
      const points = scalePoints(q).reverse()
      const counts = points.map((v) => distribution[scaleOptionId(v)] ?? 0)
      const top = Math.max(...counts)
      return (
        <ResultsBoard
          prompt={text}
          answered={answeredCount}
          total={totalPlayers}
          rows={points.map((v, i) => ({
            id: String(v),
            letter: String.fromCharCode(65 + i),
            label:
              v === Math.max(...points) && q.labels
                ? q.labels[1]
                : v === Math.min(...points) && q.labels
                  ? q.labels[0]
                  : `Poin ${v}`,
            count: counts[i],
            highlight: top > 0 && counts[i] === top,
          }))}
        />
      )
    }
    return (
      <CentralQuestionWall
        prompt={text}
        timer={timer}
        answered={answeredCount}
        total={totalPlayers}
      />
    )
  }

  // Kahoot: options stay on the wall (players only see shapes on their phones);
  // reveal lifts the correct card and fades the rest.
  return (
    <CentralQuestionWall
      compact
      prompt={text}
      timer={timer}
      answered={answeredCount}
      total={totalPlayers}
    >
      <KahootOptions
        options={questionOptions(q)}
        revealed={quizStep.stage === 'reveal'}
        correctId={quizStep.correctId}
      />
    </CentralQuestionWall>
  )
}
