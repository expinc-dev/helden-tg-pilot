import { useCallback, useEffect, useRef, useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GradientButton } from '@/components/GradientButton'
import { HostNextPhaseButton } from '@/pages/host/_shared/HostNextPhaseButton'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { renderPromptBlocks } from '@/lib/richText'
import { serverOffsetOnce } from '@/lib/session/control'
import { scoreQuizQuestion } from '@/lib/session/quizScoring'
import { useQuizStep } from '@/lib/sync/useQuizStep'
import { useTimer } from '@/lib/sync/useTimer'

import { TimerRing } from '../TimerRing'
import { LeaderboardRows } from '../components/LeaderboardRows'
import {
  type QuizContent,
  onDeviceTimerSeconds,
  questionOptions,
  resolveTimers,
  useAnsweredCount,
  useTotalPlayers,
} from '../lib'
import { isScaleQuestion } from '../scale'
import { AnswerOptionsList } from './components/AnswerOptionsList'
import {
  AnsweredStrip,
  QuestionCounter,
  QuestionText,
  QuizHostShell,
} from './components/HostQuizParts'
import { ScaleDistribution } from './components/ScaleDistribution'

export function HostQuiz({
  content,
  sessionId,
  phaseId,
  phase,
  onAdvance,
}: {
  content: QuizContent
  sessionId: string
  phaseId: string
  phase: Phase
  onAdvance?: () => void
}) {
  const { quizStep, started, write, startTimer, clearTimer } = useQuizStep(sessionId)
  const timer = useTimer(sessionId, phase)
  const q = content.questions[quizStep.step]
  const answeredCount = useAnsweredCount(sessionId, `${phaseId}_q${quizStep.step}`)
  const totalPlayers = useTotalPlayers(sessionId)
  const [confirmReveal, setConfirmReveal] = useState(false)
  const scoredRef = useRef<string | null>(null)

  // HLN-012: on_device quizzes are ungraded and single-stage. The host only
  // steps forward — no answering timer, no reveal, no scoring, no leaderboard.
  const onDevice = content.mode === 'on_device'

  const isLastQuestion = quizStep.step >= content.questions.length - 1
  const timers = resolveTimers(content)

  // Question and answer choices show together from the start — no separate
  // "Bersiap!"/reading-only step, straight into the answering timer. on_device
  // only times a statement when the author set a limit: an attitude statement is
  // not a race by default, and "time's up" there just locks answering — the host
  // still moves on by hand (no reveal to advance to).
  const handleStartQuestion = useCallback(
    async (step: number) => {
      scoredRef.current = null
      const seconds = onDevice ? onDeviceTimerSeconds(content) : timers.answering
      if (seconds !== undefined) await startTimer(phaseId, seconds)
      const offset = await serverOffsetOnce()
      await write({
        step,
        stage: 'answering',
        correctId: undefined,
        startedAt: Date.now() + offset,
      })
    },
    [write, startTimer, phaseId, timers.answering, onDevice, content]
  )

  const handleReveal = useCallback(async () => {
    await clearTimer()
    // correctId comes from the (full) bundle question — the host has it; the
    // player-safe bundle strips it, so players only learn it via this reveal write.
    const revealQuestion = content.questions[quizStep.step]
    const correctId =
      revealQuestion?.qType === 'single_choice' ? (revealQuestion.correctId ?? '') : ''
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
        questionStartMs: quizStep.startedAt,
      })
    }
  }, [
    clearTimer,
    write,
    sessionId,
    phaseId,
    quizStep.step,
    quizStep.startedAt,
    phase,
    content,
    timers.answering,
  ])

  // Manual reveal before time's up needs confirmation; the automatic reveal
  // on timer expiry (the effect below) already implies the host is fine with it.
  const handleRevealClick = useCallback(() => {
    if (timer.active && !timer.expired) {
      setConfirmReveal(true)
    } else {
      void handleReveal()
    }
  }, [timer.active, timer.expired, handleReveal])

  // Re-score before the board opens: scoring is idempotent per question, and by
  // now answers that were still in flight at reveal have landed, so the board
  // never shows a wrong/unanswered verdict for someone who did answer in time.
  const [leaderboardBusy, setLeaderboardBusy] = useState(false)
  const handleShowLeaderboard = useCallback(async () => {
    if (leaderboardBusy) return
    setLeaderboardBusy(true)
    try {
      await scoreQuizQuestion({
        sessionId,
        phase,
        questionIndex: quizStep.step,
        correctId: quizStep.correctId ?? '',
        timerSeconds: timers.answering,
        questionStartMs: quizStep.startedAt,
      })
    } catch (e) {
      console.error('rescore before leaderboard failed', e)
    } finally {
      await write({ step: quizStep.step, stage: 'leaderboard' })
      setLeaderboardBusy(false)
    }
  }, [
    leaderboardBusy,
    sessionId,
    phase,
    quizStep.step,
    quizStep.correctId,
    quizStep.startedAt,
    timers.answering,
    write,
  ])

  // Last question has no button of its own: leaving the phase is the host
  // shell's single "Tahap Selanjutnya" control (with confirm).
  const handleNext = useCallback(() => {
    if (!isLastQuestion) void handleStartQuestion(quizStep.step + 1)
  }, [isLastQuestion, quizStep.step, handleStartQuestion])

  useEffect(() => {
    if (!timer.active || !timer.expired) return
    // on_device has no reveal stage (and no correctId to score against), so an
    // expired statement timer must not trigger one.
    if (!onDevice && quizStep.stage === 'answering') handleReveal()
  }, [onDevice, quizStep.stage, timer.active, timer.expired, handleReveal])

  // Bootstrap question 0: centralStep is unset right after openPhase() opens
  // this quiz, so kick off the first question instead of waiting on a step
  // the host never explicitly takes.
  useEffect(() => {
    if (!started) void handleStartQuestion(0)
  }, [started, handleStartQuestion])

  if (!q) return null

  const text = renderPromptBlocks(q.prompt)

  const total = content.questions.length
  const nextButtonClass = 'h-16 w-full shrink-0 text-lg font-medium! tracking-[-0.04em]'
  const leaveButton = onAdvance && (
    <HostNextPhaseButton onConfirm={onAdvance} className={nextButtonClass} />
  )

  // ── on_device (attitude quiz, HLN-012) ────────────────────────────────────
  // The statement is on the player's own device, but the host (Figma H8) also
  // sees it with the live per-point vote counts, A = strongest agreement.
  if (onDevice) {
    return (
      <QuizHostShell
        footer={
          isLastQuestion ? (
            leaveButton
          ) : (
            <GradientButton onClick={handleNext} className={nextButtonClass}>
              Pernyataan Berikutnya
            </GradientButton>
          )
        }
      >
        <QuestionCounter step={quizStep.step + 1} total={total} />
        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-8">
          <QuestionText large>{text}</QuestionText>
          {isScaleQuestion(q) && (
            <ScaleDistribution
              sessionId={sessionId}
              qId={`${phaseId}_q${quizStep.step}`}
              question={q}
            />
          )}
          <div className="mt-auto">
            <AnsweredStrip answered={answeredCount} total={totalPlayers} />
          </div>
        </div>
      </QuizHostShell>
    )
  }

  return (
    <QuizHostShell
      footer={
        quizStep.stage === 'answering' ? (
          <GradientButton onClick={handleRevealClick} className={nextButtonClass}>
            Perlihatkan Jawaban
          </GradientButton>
        ) : quizStep.stage === 'reveal' ? (
          <GradientButton
            disabled={leaderboardBusy}
            onClick={() => void handleShowLeaderboard()}
            className={`${nextButtonClass} flex items-center justify-center gap-2`}
          >
            <Icon icon="material-symbols:leaderboard-outline-rounded" className="size-6" />
            Lihat Leaderboard
          </GradientButton>
        ) : isLastQuestion ? (
          leaveButton
        ) : (
          <GradientButton onClick={handleNext} className={nextButtonClass}>
            Soal Berikutnya
          </GradientButton>
        )
      }
    >
      <QuestionCounter step={quizStep.step + 1} total={total} />

      {quizStep.stage === 'answering' && (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-8 overflow-y-auto p-8">
          {timer.active && (
            <TimerRing
              remainingSec={timer.remainingSec}
              totalSec={timers.answering}
              expired={timer.expired}
              size={140}
            />
          )}
          <QuestionText>{text}</QuestionText>
          <AnswerOptionsList
            sessionId={sessionId}
            phaseId={phaseId}
            questionIndex={quizStep.step}
            options={questionOptions(q)}
            revealed={false}
          />
          <AnsweredStrip answered={answeredCount} total={totalPlayers} />
        </div>
      )}

      {quizStep.stage === 'reveal' && (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-8 overflow-y-auto p-8">
          <QuestionText large={questionOptions(q).length > 2}>{text}</QuestionText>
          <AnswerOptionsList
            sessionId={sessionId}
            phaseId={phaseId}
            questionIndex={quizStep.step}
            options={questionOptions(q)}
            revealed
            correctId={quizStep.correctId}
          />
          <AnsweredStrip answered={answeredCount} total={totalPlayers} />
        </div>
      )}

      {quizStep.stage === 'leaderboard' && (
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-8">
          <h2 className="text-2xl font-bold tracking-[-0.04em] text-white">Leaderboard</h2>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#353535] bg-black/20">
            <LeaderboardRows
              sessionId={sessionId}
              phase={phase}
              content={content}
              questionId={`${phaseId}_q${quizStep.step}`}
              revealedCount={quizStep.step + 1}
            />
          </div>
        </div>
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
    </QuizHostShell>
  )
}
