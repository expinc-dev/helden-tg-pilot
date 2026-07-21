import { useCallback, useEffect, useRef, useState } from 'react'

import { GradientButton } from '@/components/GradientButton'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { demoBundle } from '@/lib/demoBundle'
import { endLevel, nextPhase, quizAnswerKeys } from '@/lib/session/control'
import { scoreQuizQuestion } from '@/lib/session/quizScoring'
import { mmss } from '@/lib/sync/timermath'
import { useQuizStep } from '@/lib/sync/useQuizStep'
import { useTimer } from '@/lib/sync/useTimer'

import {
  type QuizContent,
  promptText,
  questionOptions,
  resolveTimers,
  useAnsweredCount,
  useTotalPlayers,
} from '../lib'
import { DistributionBars } from './components/DistributionBars'
import { LeaderboardPanel } from './components/LeaderboardPanel'

export function HostQuiz({
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
  const { quizStep, write, startTimer, clearTimer } = useQuizStep(sessionId)
  const timer = useTimer(sessionId, phase)
  const q = content.questions[quizStep.step]
  const answeredCount = useAnsweredCount(sessionId, `${phaseId}_q${quizStep.step}`)
  const totalPlayers = useTotalPlayers(sessionId)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const scoredRef = useRef<string | null>(null)

  const isLastQuestion = quizStep.step >= content.questions.length - 1
  const timers = resolveTimers(content)

  const handlePreparation = useCallback(
    (step: number) => {
      scoredRef.current = null
      void write({ step, stage: 'preparation', correctId: undefined })
    },
    [write]
  )

  const handleStartReading = useCallback(async () => {
    await startTimer(phaseId, timers.reading)
    await write({ step: quizStep.step, stage: 'reading' })
  }, [write, startTimer, phaseId, timers.reading, quizStep.step])

  const handleStartAnswering = useCallback(async () => {
    await startTimer(phaseId, timers.answering)
    await write({ step: quizStep.step, stage: 'answering' })
  }, [write, startTimer, phaseId, timers.answering, quizStep.step])

  const handleReveal = useCallback(async () => {
    await clearTimer()
    const correctId = quizAnswerKeys[phaseId]?.[quizStep.step] ?? ''
    await write({ step: quizStep.step, stage: 'reveal', correctId })

    const scoreKey = `${phaseId}_q${quizStep.step}`
    if (scoredRef.current !== scoreKey) {
      scoredRef.current = scoreKey
      await scoreQuizQuestion({
        sessionId,
        phase,
        questionIndex: quizStep.step,
        correctId,
        timerSeconds: timers.answering,
      })
    }
  }, [clearTimer, write, sessionId, phaseId, quizStep.step, phase, timers.answering])

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      const isModular = (demoBundle.flowMode ?? 'sequential') !== 'sequential'
      void (isModular ? endLevel(sessionId, phaseId) : nextPhase(sessionId, phaseId))
    } else {
      handlePreparation(quizStep.step + 1)
    }
  }, [isLastQuestion, sessionId, phaseId, quizStep.step, handlePreparation])

  useEffect(() => {
    if (!timer.active || !timer.expired) return
    if (quizStep.stage === 'reading') {
      handleStartAnswering()
    } else if (quizStep.stage === 'answering') {
      handleReveal()
    }
  }, [quizStep.stage, timer.active, timer.expired, handleStartAnswering, handleReveal])

  if (!q) return null

  const text = promptText(q)
  const stageLabel =
    quizStep.stage === 'preparation'
      ? 'Persiapan'
      : quizStep.stage === 'reading'
        ? 'Membaca'
        : quizStep.stage === 'answering'
          ? 'Menjawab'
          : 'Reveal'

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#FFB800]/10 px-3 py-1 text-sm font-medium text-[#FFB800]">
            Soal {quizStep.step + 1} / {content.questions.length}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/40">
            {stageLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLeaderboardOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 transition hover:bg-white/10"
        >
          {leaderboardOpen ? (
            'Tutup'
          ) : (
            <>
              <Icon icon="mdi:trophy" className="size-4" /> Leaderboard
            </>
          )}
        </button>
      </div>

      {quizStep.stage !== 'preparation' && (
        <div className="rounded-xl border border-white/10 bg-[#181818] p-5">
          <p className="text-lg leading-relaxed font-semibold text-white">{text}</p>
        </div>
      )}

      {quizStep.stage === 'preparation' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <Icon icon="mdi:target" className="size-12 text-[#FFB800]" />
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-8 py-4 text-center">
            <p className="text-sm text-white/40">Semua layar menampilkan</p>
            <p className="mt-1 text-lg font-medium text-white/70">"Bersiap!"</p>
          </div>
          <GradientButton onClick={handleStartReading} className="px-10 py-3.5 text-lg">
            Mulai ▶
          </GradientButton>
        </div>
      )}

      {quizStep.stage === 'reading' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          {timer.active && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-white/40">Waktu baca</span>
              <span
                className="font-mono text-5xl font-bold tabular-nums"
                style={{ color: timer.remainingSec <= 3 ? '#E21B3C' : '#FFB800' }}
              >
                {mmss(timer.remainingSec)}
              </span>
            </div>
          )}
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-8 py-4 text-center">
            <p className="text-sm text-white/40">Pemain melihat</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-lg font-medium text-white/70">
              <Icon icon="mdi:television" className="size-5" /> "Perhatikan Layar Utama"
            </p>
          </div>
          <p className="text-sm text-white/30">Jawaban otomatis terbuka saat waktu baca habis</p>
        </div>
      )}

      {quizStep.stage === 'answering' && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
            {timer.active && (
              <span
                className="flex items-center gap-1.5 font-mono text-3xl font-bold tabular-nums"
                style={{ color: timer.remainingSec <= 5 ? '#E21B3C' : '#FFB800' }}
              >
                {timer.expired ? (
                  <>
                    <Icon icon="mdi:alarm" className="size-7" /> Waktu habis
                  </>
                ) : (
                  mmss(timer.remainingSec)
                )}
              </span>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-[#FFB800]">{answeredCount}</span>
              <span className="text-white/40">/ {totalPlayers} menjawab</span>
            </div>
          </div>

          <DistributionBars
            sessionId={sessionId}
            phaseId={phaseId}
            questionIndex={quizStep.step}
            options={questionOptions(q)}
            showCorrect={false}
          />

          <GradientButton onClick={handleReveal} className="mt-auto px-6 py-3 text-base">
            Reveal Jawaban
          </GradientButton>
        </div>
      )}

      {quizStep.stage === 'reveal' && (
        <div className="flex flex-1 flex-col gap-4">
          <DistributionBars
            sessionId={sessionId}
            phaseId={phaseId}
            questionIndex={quizStep.step}
            options={questionOptions(q)}
            showCorrect
            correctId={quizStep.correctId}
          />

          <GradientButton
            onClick={handleNext}
            className="mt-auto flex items-center justify-center gap-1.5 px-6 py-3 text-base"
          >
            {isLastQuestion ? (
              <>
                <Icon icon="mdi:check-circle" className="size-5" /> Selesai
              </>
            ) : (
              'Soal Berikutnya →'
            )}
          </GradientButton>
        </div>
      )}

      {leaderboardOpen && <LeaderboardPanel sessionId={sessionId} phase={phase} />}
    </div>
  )
}
