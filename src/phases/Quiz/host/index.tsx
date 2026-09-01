import { useCallback, useEffect, useRef, useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GradientButton } from '@/components/GradientButton'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { demoBundle } from '@/lib/demoBundle'
import { renderPromptBlocks } from '@/lib/richText'
import { endLevel, nextPhase } from '@/lib/session/control'
import { scoreQuizQuestion } from '@/lib/session/quizScoring'
import { useQuizStep } from '@/lib/sync/useQuizStep'
import { useTimer } from '@/lib/sync/useTimer'

import { TimerRing } from '../TimerRing'
import { LeaderboardRows } from '../components/LeaderboardRows'
import {
  type QuizContent,
  questionOptions,
  resolveTimers,
  useAnsweredCount,
  useTotalPlayers,
} from '../lib'
import { AnswerOptionsList } from './components/AnswerOptionsList'

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
  const { quizStep, started, write, startTimer, clearTimer } = useQuizStep(sessionId)
  const timer = useTimer(sessionId, phase)
  const q = content.questions[quizStep.step]
  const answeredCount = useAnsweredCount(sessionId, `${phaseId}_q${quizStep.step}`)
  const totalPlayers = useTotalPlayers(sessionId)
  const [confirmReveal, setConfirmReveal] = useState(false)
  const scoredRef = useRef<string | null>(null)

  const isLastQuestion = quizStep.step >= content.questions.length - 1
  const timers = resolveTimers(content)

  // Question and answer choices show together from the start — no separate
  // "Bersiap!"/reading-only step, straight into the answering timer.
  const handleStartQuestion = useCallback(
    async (step: number) => {
      scoredRef.current = null
      await startTimer(phaseId, timers.answering)
      await write({ step, stage: 'answering', correctId: undefined })
    },
    [write, startTimer, phaseId, timers.answering]
  )

  const handleReveal = useCallback(async () => {
    await clearTimer()
    // correctId comes from the (full) bundle question — the host has it; the
    // player-safe bundle strips it, so players only learn it via this reveal write.
    const correctId = content.questions[quizStep.step]?.correctId ?? ''
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
  }, [clearTimer, write, sessionId, phaseId, quizStep.step, phase, content, timers.answering])

  // Manual reveal before time's up needs confirmation; the automatic reveal
  // on timer expiry (the effect below) already implies the host is fine with it.
  const handleRevealClick = useCallback(() => {
    if (timer.active && !timer.expired) {
      setConfirmReveal(true)
    } else {
      void handleReveal()
    }
  }, [timer.active, timer.expired, handleReveal])

  const handleShowLeaderboard = useCallback(() => {
    void write({ step: quizStep.step, stage: 'leaderboard' })
  }, [write, quizStep.step])

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      const isModular = (demoBundle.flowMode ?? 'sequential') !== 'sequential'
      void (isModular ? endLevel(sessionId, phaseId) : nextPhase(sessionId, phaseId))
    } else {
      void handleStartQuestion(quizStep.step + 1)
    }
  }, [isLastQuestion, sessionId, phaseId, quizStep.step, handleStartQuestion])

  useEffect(() => {
    if (!timer.active || !timer.expired) return
    if (quizStep.stage === 'answering') handleReveal()
  }, [quizStep.stage, timer.active, timer.expired, handleReveal])

  // Bootstrap question 0: centralStep is unset right after openPhase() opens
  // this quiz, so kick off the first question instead of waiting on a step
  // the host never explicitly takes.
  useEffect(() => {
    if (!started) void handleStartQuestion(0)
  }, [started, handleStartQuestion])

  if (!q) return null

  const text = renderPromptBlocks(q.prompt)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/20 px-10 py-3">
        <div className="text-2xl">
          <span className="text-helden-yellow font-bold">{quizStep.step + 1}</span>
          <span className="font-thin text-white">/{content.questions.length}</span>
        </div>
      </div>

      {quizStep.stage === 'answering' && (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-4">
          {timer.active && (
            <TimerRing
              remainingSec={timer.remainingSec}
              totalSec={timers.answering}
              expired={timer.expired}
              size={120}
              className="mt-10"
            />
          )}

          <div className="flex w-full items-start px-10 py-5">
            <p className="text-2xl leading-relaxed font-normal text-white">{text}</p>
          </div>

          <AnswerOptionsList
            sessionId={sessionId}
            phaseId={phaseId}
            questionIndex={quizStep.step}
            options={questionOptions(q)}
            revealed={false}
          />

          <div className="flex w-full flex-col gap-3 px-10">
            <div className="mt-auto flex items-center gap-3 rounded-lg border border-white/15 bg-[rgba(253,219,0,0.08)] px-4 py-2.5">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#FFB800] transition-all duration-500"
                  style={{
                    width: `${totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="shrink-0 text-xs whitespace-nowrap text-white">
                <span className="text-helden-yellow font-bold">{answeredCount}</span> dari{' '}
                <span className="text-helden-yellow font-bold">{totalPlayers}</span> pemain telah
                menjawab
              </span>
            </div>
          </div>

          <div className="mt-auto flex w-full flex-col gap-3 px-10 pb-10">
            <GradientButton onClick={handleRevealClick} className="w-full px-6 py-3 text-base">
              Perlihatkan Jawaban
            </GradientButton>
          </div>
        </div>
      )}

      {quizStep.stage === 'reveal' && (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="px-12 py-10">
            <p className="text-2xl leading-relaxed font-normal text-white">{text}</p>
          </div>

          <AnswerOptionsList
            sessionId={sessionId}
            phaseId={phaseId}
            questionIndex={quizStep.step}
            options={questionOptions(q)}
            revealed
            correctId={quizStep.correctId}
          />

          <div className="mt-auto flex w-full flex-col gap-3 px-10 pb-10">
            <GradientButton
              onClick={handleShowLeaderboard}
              className="flex items-center justify-center gap-1.5 px-6 py-3 text-base"
            >
              <Icon icon="material-symbols:leaderboard-outline-rounded" className="size-5" /> Lihat
              Leaderboard
            </GradientButton>
          </div>
        </div>
      )}

      {quizStep.stage === 'leaderboard' && (
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-10">
          <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20">
            <LeaderboardRows sessionId={sessionId} phase={phase} content={content} />
          </div>

          <div className="flex w-full flex-col gap-3 pb-10">
            <GradientButton
              onClick={handleNext}
              className="flex items-center justify-center gap-1.5 px-6 py-3 text-base"
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
    </div>
  )
}
