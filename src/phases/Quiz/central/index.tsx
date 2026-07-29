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
  useLeaderboardOpen,
  useTotalPlayers,
} from '../lib'
import { LeaderboardScreen } from './components/LeaderboardScreen'
import { RevealOverlay } from './components/RevealOverlay'

// Ribbon/tag notch on the right edge of each answer bar — fixed pixel depth
// so it stays a crisp point regardless of the bar's rendered width.
const CHEVRON_CLIP = 'polygon(0 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 0 100%)'

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
  const leaderboardOpen = useLeaderboardOpen(sessionId)
  const q = content.questions[quizStep.step]
  const answeredCount = useAnsweredCount(sessionId, `${phaseId}_q${quizStep.step}`)
  const totalPlayers = useTotalPlayers(sessionId)
  const timers = resolveTimers(content)

  if (leaderboardOpen) {
    return <LeaderboardScreen sessionId={sessionId} phase={phase} content={content} />
  }

  if (!q) return null

  const text = promptText(q)
  const answeredPct = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0
  const isAnsweringTimer = quizStep.stage === 'answering'

  return (
    <div
      className="fixed inset-0 flex flex-col gap-6 p-10"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="text-4xl font-bold">
          <span style={{ color: '#FFB800' }}>{quizStep.step + 1}</span>
          <span className="text-white/40">/{content.questions.length}</span>
        </div>
        {timer.active && (
          <TimerRing
            remainingSec={timer.remainingSec}
            totalSec={isAnsweringTimer ? timers.answering : timers.reading}
            expired={isAnsweringTimer && timer.expired}
            size={72}
          />
        )}
      </div>

      {quizStep.stage === 'preparation' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <Icon icon="mdi:target" className="size-16 text-[#FFB800]" />
          <h1 className="text-4xl font-bold text-[#FFB800]">Bersiap!</h1>
          <div className="h-1 w-40 animate-pulse rounded-full bg-[#FFB800]/30" />
        </div>
      ) : (
        <>
          <div className="mx-auto w-full max-w-4xl rounded-2xl bg-black/30 px-10 py-8">
            <h1 className="text-center text-4xl leading-tight font-bold text-white">{text}</h1>
            {quizStep.stage === 'reading' && (
              <p className="mt-4 text-center text-lg text-white/40">Baca pertanyaan...</p>
            )}
          </div>

          {(quizStep.stage === 'answering' || quizStep.stage === 'reveal') &&
            questionOptions(q).length > 0 && (
              <div className="grid w-full max-w-4xl grid-cols-2 gap-5 self-center">
                {questionOptions(q).map((opt, i) => {
                  const color = OPTION_COLORS[i % OPTION_COLORS.length]
                  const icon = OPTION_ICONS[i % OPTION_ICONS.length]
                  const isCorrect = quizStep.stage === 'reveal' && quizStep.correctId === opt.id
                  const isFaded = quizStep.stage === 'reveal' && !isCorrect
                  return (
                    <div
                      key={opt.id}
                      className="relative transition-all duration-300"
                      style={{
                        opacity: isFaded ? 0.25 : 1,
                        transform: isCorrect ? 'scale(1.03)' : 'scale(1)',
                      }}
                    >
                      <div
                        className="relative flex items-center gap-4 bg-white/5 px-6 py-5 ring-1 ring-white/10"
                        style={{
                          clipPath: CHEVRON_CLIP,
                          boxShadow: isCorrect ? `0 0 0 2px ${color.bg}` : undefined,
                        }}
                      >
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background: `linear-gradient(to right, ${color.bg}, transparent 65%)`,
                          }}
                        />
                        <div
                          className="relative flex size-11 shrink-0 items-center justify-center rounded-full shadow"
                          style={{ background: color.bg }}
                        >
                          <Icon icon={icon} className="size-6" style={{ color: color.text }} />
                        </div>
                        <span className="relative text-lg font-semibold text-white">
                          {opt.label}
                        </span>
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

          {(quizStep.stage === 'answering' || quizStep.stage === 'reveal') && totalPlayers > 0 && (
            <div className="mx-auto flex w-full max-w-4xl items-center gap-4 rounded-lg border border-white/15 bg-black/20 px-5 py-3">
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
          )}

          {quizStep.stage === 'reveal' && (
            <div className="flex justify-center">
              <RevealOverlay
                sessionId={sessionId}
                phaseId={phaseId}
                questionIndex={quizStep.step}
                options={questionOptions(q)}
                phase={phase}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
