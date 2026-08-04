import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { useQuizStep } from '@/lib/sync/useQuizStep'
import { useTimer } from '@/lib/sync/useTimer'

import { TimerRing } from '../TimerRing'
import {
  OPTION_COLORS,
  OPTION_ICONS,
  type QuizContent,
  promptText,
  questionOptions,
  resolveTimers,
  useAnsweredCount,
  useTotalPlayers,
} from '../lib'
import { LeaderboardScreen } from './components/LeaderboardScreen'

// Ribbon/tag notch on the right edge of each answer bar — fixed pixel depth
// so it stays a crisp point regardless of the bar's rendered width.
const CHEVRON_CLIP = 'polygon(0 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 0 100%)'

const ANSWER_COLORS = [
  {
    border: `1px solid #E92D23`,
    background: `linear-gradient(0deg, rgba(233, 45, 35, 0.20) 0%, rgba(233, 45, 35, 0.20) 100%), #1E1E1D`,
  },
  {
    border: `1px solid  blue`,
    background: `linear-gradient(0deg, rgba(35, 107, 237, 0.20) 0%, rgba(35, 107, 237, 0.20) 100%), #1E1E1D`,
  },
  {
    border: `1px solid yellow`,
    background: `linear-gradient(0deg, rgba(251, 185, 10, 0.20) 0%, rgba(251, 185, 10, 0.20) 100%), #1E1E1D`,
  },
  {
    border: `1px solid  green`,
    background: `linear-gradient(0deg, rgba(65, 203, 67, 0.20) 0%, rgba(65, 203, 67, 0.20) 100%), #1E1E1D`,
  },
]

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
  const timers = resolveTimers(content)

  if (quizStep.stage === 'leaderboard') {
    return <LeaderboardScreen sessionId={sessionId} phase={phase} content={content} />
  }

  if (!q) return null

  const text = promptText(q)
  const answeredPct = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0

  return (
    <div
      className="fixed inset-0 flex flex-col gap-6 p-10"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex items-center justify-between px-10">
        <div className="text-4xl font-normal">
          <span className="text-helden-yellow">{quizStep.step + 1}</span>
          <span className="text-white">/{content.questions.length}</span>
        </div>

        <div className="mx-auto w-full max-w-4xl rounded-sm bg-black/30 px-10 py-20">
          <h1 className="text-center text-4xl leading-tight font-bold text-white">{text}</h1>
        </div>

        {timer.active && (
          <TimerRing
            remainingSec={timer.remainingSec}
            totalSec={timers.answering}
            expired={timer.expired}
            size={100}
          />
        )}
      </div>

      {questionOptions(q).length > 0 && (
        <div className="grid h-[50dvh] w-full grid-cols-2 gap-5 self-center px-10">
          {questionOptions(q).map((opt, i) => {
            const color = OPTION_COLORS[i % OPTION_COLORS.length]
            const icon = OPTION_ICONS[i % OPTION_ICONS.length]
            const isCorrect = quizStep.stage === 'reveal' && quizStep.correctId === opt.id
            const isFaded = quizStep.stage === 'reveal' && !isCorrect
            return (
              <div
                key={opt.id}
                className="relative rounded-2xl transition-all duration-300"
                style={{
                  opacity: isFaded ? 0.25 : 1,
                  transform: isCorrect ? 'scale(1.03)' : 'scale(1)',
                  borderRadius: 8,
                }}
              >
                <div
                  className="relative flex h-full items-center gap-4 overflow-hidden bg-white/5 ring-1 ring-white/10"
                  style={{
                    boxShadow: isCorrect ? `0 0 0 2px ${color.bg}` : undefined,
                    borderRadius: 8,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      ...ANSWER_COLORS[i % ANSWER_COLORS.length],
                      borderRadius: 8,
                    }}
                  />
                  <div
                    className={`relative flex h-full w-30 shrink-0 items-center justify-center shadow ${i === 0 ? 'bg-quiz-red-gradient' : i === 1 ? 'bg-quiz-blue-gradient' : i === 2 ? 'bg-quiz-yellow-gradient' : 'bg-quiz-green-gradient'}`}
                    style={{
                      clipPath: CHEVRON_CLIP,
                    }}
                  >
                    <Icon icon={icon} className="size-15 text-black/60" />
                  </div>
                  <div className="flex flex-1 items-center justify-center">
                    <span className="relative text-center text-lg font-semibold text-white">
                      {opt.label}
                    </span>
                  </div>
                </div>
                {isCorrect && (
                  <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-[#26890C] text-white shadow">
                    <Icon icon="mdi:check" className="size-4" />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {totalPlayers > 0 && (
        <div className="flex w-full px-10">
          <div className="mx-auto flex w-full items-center gap-4 rounded-lg border border-white/15 bg-black/20 px-5 py-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#FFB800] transition-all duration-500"
                style={{ width: `${answeredPct}%` }}
              />
            </div>
            <p className="shrink-0 text-sm whitespace-nowrap text-white/60">
              <span className="font-bold text-white">{answeredCount}</span> dari{' '}
              <span className="font-bold text-white">{totalPlayers}</span> pemain telah menjawab
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
