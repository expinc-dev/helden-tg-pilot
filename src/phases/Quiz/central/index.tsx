import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { mmss } from '@/lib/sync/timermath'
import { useQuizStep } from '@/lib/sync/useQuizStep'
import { useTimer } from '@/lib/sync/useTimer'

import {
  OPTION_COLORS,
  OPTION_ICONS,
  type QuizContent,
  promptText,
  questionOptions,
  useAnsweredCount,
  useTotalPlayers,
} from '../lib'
import { RevealOverlay } from './components/RevealOverlay'

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

  if (!q) return null

  const text = promptText(q)
  const showQuestion = quizStep.stage !== 'preparation'

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="rounded-full bg-white/10 px-5 py-1.5 text-lg font-medium text-white/70">
        {quizStep.step + 1} / {content.questions.length}
      </div>

      {quizStep.stage === 'preparation' && (
        <>
          <Icon icon="mdi:target" className="size-16 text-[#FFB800]" />
          <h1 className="text-4xl font-bold text-[#FFB800]">Bersiap!</h1>
          <div className="h-1 w-40 animate-pulse rounded-full bg-[#FFB800]/30" />
        </>
      )}

      {showQuestion && (
        <h1 className="max-w-4xl text-center text-4xl leading-tight font-bold text-white drop-shadow-lg">
          {text}
        </h1>
      )}

      {quizStep.stage === 'reading' && timer.active && (
        <>
          <div
            className="text-7xl font-bold tabular-nums"
            style={{ color: timer.remainingSec <= 3 ? '#E21B3C' : '#FFB800' }}
          >
            {mmss(timer.remainingSec)}
          </div>
          <div className="text-xl text-white/50">Baca pertanyaan...</div>
        </>
      )}

      {quizStep.stage === 'answering' && (
        <>
          {timer.active && (
            <div
              className="text-7xl font-bold tabular-nums"
              style={{ color: timer.remainingSec <= 5 ? '#E21B3C' : '#FFB800' }}
            >
              {timer.expired ? 'Waktu habis!' : mmss(timer.remainingSec)}
            </div>
          )}
          <div className="flex items-center gap-3 rounded-full bg-white/10 px-6 py-2 text-xl text-white/80">
            <span className="font-bold text-[#FFB800]">{answeredCount}</span>
            <span>/</span>
            <span>{totalPlayers}</span>
            <span className="text-white/50">menjawab</span>
          </div>
        </>
      )}

      {(quizStep.stage === 'answering' || quizStep.stage === 'reveal') &&
        questionOptions(q).length > 0 && (
          <div className="grid w-full max-w-4xl grid-cols-2 gap-4">
            {questionOptions(q).map((opt, i) => {
              const color = OPTION_COLORS[i % OPTION_COLORS.length]
              const icon = OPTION_ICONS[i % OPTION_ICONS.length]
              const isCorrect = quizStep.stage === 'reveal' && quizStep.correctId === opt.id
              return (
                <div
                  key={opt.id}
                  className="relative flex items-center justify-center gap-3 overflow-hidden rounded-xl p-6 text-center text-xl font-semibold shadow-lg transition-all duration-300"
                  style={{
                    background: color.bg,
                    color: color.text,
                    opacity: quizStep.stage === 'reveal' && !isCorrect ? 0.35 : 1,
                    transform: isCorrect ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <Icon icon={icon} className="size-7 shrink-0" />
                  <span>{opt.label}</span>
                  {isCorrect && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-600 shadow">
                      <Icon icon="mdi:check-circle" className="size-5" />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

      {quizStep.stage === 'reveal' && (
        <RevealOverlay
          sessionId={sessionId}
          phaseId={phaseId}
          questionIndex={quizStep.step}
          options={questionOptions(q)}
          phase={phase}
        />
      )}
    </div>
  )
}
