import { useCallback, useEffect, useRef, useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GradientButton } from '@/components/GradientButton'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { demoBundle } from '@/lib/demoBundle'
import { endLevel, nextPhase, quizAnswerKeys } from '@/lib/session/control'
import { scoreQuizQuestion } from '@/lib/session/quizScoring'
import { useQuizStep } from '@/lib/sync/useQuizStep'
import { useTimer } from '@/lib/sync/useTimer'

import { TimerRing } from '../TimerRing'
import {
  type QuizContent,
  promptText,
  questionOptions,
  resolveTimers,
  useAnsweredCount,
  useTotalPlayers,
  writeLeaderboardOpen,
} from '../lib'
import { AnswerOptionsList } from './components/AnswerOptionsList'
import { LeaderboardPanel } from './components/LeaderboardPanel'

const strokeContainer = '1px solid var(--Stroke-Container, #353535)'

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
  const [confirmReveal, setConfirmReveal] = useState(false)
  const scoredRef = useRef<string | null>(null)

  const isLastQuestion = quizStep.step >= content.questions.length - 1
  const timers = resolveTimers(content)

  const closeLeaderboard = useCallback(() => {
    setLeaderboardOpen(false)
    void writeLeaderboardOpen(sessionId, false)
  }, [sessionId])

  const toggleLeaderboard = useCallback(() => {
    setLeaderboardOpen((o) => {
      const next = !o
      void writeLeaderboardOpen(sessionId, next)
      return next
    })
  }, [sessionId])

  const handlePreparation = useCallback(
    (step: number) => {
      scoredRef.current = null
      closeLeaderboard()
      void write({ step, stage: 'preparation', correctId: undefined })
    },
    [write, closeLeaderboard]
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

  // Manual reveal before time's up needs confirmation; the automatic reveal
  // on timer expiry (the effect below) already implies the host is fine with it.
  const handleRevealClick = useCallback(() => {
    if (timer.active && !timer.expired) {
      setConfirmReveal(true)
    } else {
      void handleReveal()
    }
  }, [timer.active, timer.expired, handleReveal])

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      closeLeaderboard()
      const isModular = (demoBundle.flowMode ?? 'sequential') !== 'sequential'
      void (isModular ? endLevel(sessionId, phaseId) : nextPhase(sessionId, phaseId))
    } else {
      handlePreparation(quizStep.step + 1)
    }
  }, [isLastQuestion, sessionId, phaseId, quizStep.step, handlePreparation, closeLeaderboard])

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

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">
          <span style={{ color: '#FFB800' }}>{quizStep.step + 1}</span>
          <span className="text-white/40">/{content.questions.length}</span>
        </div>
        <button
          type="button"
          onClick={toggleLeaderboard}
          aria-label="Leaderboard"
          className="flex size-8 items-center justify-center rounded-lg bg-[#FFB800] text-black shadow transition hover:brightness-110"
        >
          <Icon icon="mdi:poll" className="size-4" />
        </button>
      </div>

      {quizStep.stage !== 'preparation' && (
        <div className="rounded-xl p-5" style={{ border: strokeContainer, background: '#181818' }}>
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
            <TimerRing
              remainingSec={timer.remainingSec}
              totalSec={timers.reading}
              expired={false}
              size={90}
            />
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
        <div className="flex flex-1 flex-col items-center gap-4">
          {timer.active && (
            <TimerRing
              remainingSec={timer.remainingSec}
              totalSec={timers.answering}
              expired={timer.expired}
              size={90}
            />
          )}

          <AnswerOptionsList
            sessionId={sessionId}
            phaseId={phaseId}
            questionIndex={quizStep.step}
            options={questionOptions(q)}
            revealed={false}
          />

          <div className="mt-auto flex w-full items-center gap-3 rounded-lg border border-white/15 bg-[rgba(253,219,0,0.08)] px-4 py-2.5">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#FFB800] transition-all duration-500"
                style={{ width: `${totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0}%` }}
              />
            </div>
            <span className="shrink-0 text-xs whitespace-nowrap text-white/60">
              <span className="font-bold text-white">{answeredCount}</span> dari{' '}
              <span className="font-bold text-white">{totalPlayers}</span> pemain telah menjawab
            </span>
          </div>

          <GradientButton onClick={handleRevealClick} className="w-full px-6 py-3 text-base">
            Perlihatkan Jawaban
          </GradientButton>
        </div>
      )}

      {quizStep.stage === 'reveal' && (
        <div className="flex flex-1 flex-col gap-4">
          <AnswerOptionsList
            sessionId={sessionId}
            phaseId={phaseId}
            questionIndex={quizStep.step}
            options={questionOptions(q)}
            revealed
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

      {leaderboardOpen && (
        <LeaderboardPanel
          sessionId={sessionId}
          phase={phase}
          content={content}
          onClose={closeLeaderboard}
        />
      )}

      {confirmReveal && (
        <ConfirmDialog
          title="Perlihatkan jawaban?"
          message="Waktu level masih panjang, apakah kamu yakin memperlihatkan jawaban?"
          confirmLabel="Perlihatkan"
          cancelLabel="Kembali"
          onCancel={() => setConfirmReveal(false)}
          onConfirm={() => {
            setConfirmReveal(false)
            void handleReveal()
          }}
        />
      )}
    </div>
  )
}
