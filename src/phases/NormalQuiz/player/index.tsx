import { useEffect, useState } from 'react'

import { AnswerSavedScreen } from '@/components/AnswerSavedScreen'
import { LetterOption } from '@/components/LetterOption'
import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'
import type { Phase, Question } from '@helden-inc/tg-schema'
import { get } from 'firebase/database'

import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'
import { TimerRing } from '@/phases/Quiz/TimerRing'

import { eref } from '@/lib/firebase'
import { renderPromptBlocks } from '@/lib/richText'
import { submitAnswer } from '@/lib/sync/submitAnswer'
import { usePlayerStep } from '@/lib/sync/usePlayerStep'
import { type TimerState, useTimer } from '@/lib/sync/useTimer'

import {
  type NormalQuizContent,
  isChoiceQuestion,
  qIdOf,
  useNormalQuizOutcomes,
  useNormalQuizPoints,
} from '../lib'
import { ResultScreen } from './ResultScreen'

// Figma question prompt (same as the microlearning question screen).
const PROMPT_CLASS = 'text-xl leading-[1.3] font-medium tracking-[-0.04em] text-[#ccc]'

// Self-paced: each player works through the questions at their own pace. Progress
// is the per-player selfStep (players/{id}/selfStep/{phaseId}) — the same node the
// host's progress list and central's overall-progress screen already read.
export function PlayerNormalQuiz({
  content,
  sessionId,
  playerId,
  phase,
}: {
  content: NormalQuizContent
  sessionId: string
  playerId: string
  phase: Phase
}) {
  // 'self_paced' is fixed rather than phase.syncMode: publish hard-fails anything
  // else (tg-cms publish.ts), and the lockstep path would point every player at one
  // shared step.
  const [step, writeStep, loaded] = usePlayerStep(sessionId, playerId, 'self_paced', phase.id)
  const timer = useTimer(sessionId, phase)
  const { outcomes, released } = useNormalQuizOutcomes(sessionId, phase.id)
  const points = useNormalQuizPoints(sessionId, phase.id)
  const total = content.questions.length

  // Until the step read lands, `step` is a meaningless 0 — rendering (or acting on)
  // it would flash question 1 at a player who is really on question 4.
  if (!loaded) return null

  // Results win over everything: once the host has graded, the quiz is over for
  // this player even if they had questions left.
  if (released) {
    return (
      <ResultScreen
        content={content}
        phaseId={phase.id}
        playerId={playerId}
        step={step}
        outcomes={outcomes}
        points={points}
      />
    )
  }

  if (step >= total) {
    return <AnswerSavedScreen title="Selesai!" subtitle="Menunggu pemain lainnya dan host..." />
  }

  if (timer.active && timer.expired) {
    return (
      <AnswerSavedScreen
        tone="neutral"
        title="Waktu Habis"
        subtitle="Menunggu hasil dari host..."
      />
    )
  }

  return (
    <QuestionStep
      // Remount per question so the picked option never carries into the next one.
      key={step}
      question={content.questions[step]}
      index={step}
      total={total}
      sessionId={sessionId}
      playerId={playerId}
      phase={phase}
      timer={timer}
      writeStep={writeStep}
    />
  )
}

function QuestionStep({
  question,
  index,
  total,
  sessionId,
  playerId,
  phase,
  timer,
  writeStep,
}: {
  question: Question
  index: number
  total: number
  sessionId: string
  playerId: string
  phase: Phase
  timer: TimerState
  writeStep: (n: number) => Promise<void> | undefined
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const qId = qIdOf(phase.id, index)

  // A crash between submitAnswer and the selfStep write leaves the answer saved
  // but the step one behind. Re-opening that question must move on, not offer a
  // second (possibly different) answer.
  useEffect(() => {
    let cancelled = false
    get(eref(`sessions/${sessionId}/players/${playerId}/answers/${qId}`))
      .then((s) => {
        if (!cancelled && s.exists()) void writeStep(index + 1)
      })
      .catch(() => undefined) // no read = no recovery, the player just answers normally
    return () => {
      cancelled = true
    }
  }, [sessionId, playerId, qId, index, writeStep])

  const showRing = timer.active && !!phase.timer && phase.timer.visibleTo.includes('player')

  // tg-cms only allows single_choice here. Anything else means a malformed bundle:
  // let the player step past it instead of stranding them on a dead screen.
  if (!isChoiceQuestion(question)) {
    return (
      <PlayerScreenFrame
        footer={<ActionButton onClick={() => void writeStep(index + 1)}>Lewati</ActionButton>}
      >
        <p className="text-center text-base text-white/80">Soal ini tidak bisa ditampilkan.</p>
      </PlayerScreenFrame>
    )
  }

  const commit = async () => {
    if (!picked || busy) return
    setBusy(true)
    try {
      await submitAnswer({
        sessionId,
        playerId,
        keyId: playerId,
        qId,
        value: picked,
        optionId: picked,
      })
      await writeStep(index + 1)
    } finally {
      // The component remounts on success (keyed by step); on failure this
      // re-enables the button so the player can retry.
      setBusy(false)
    }
  }

  return (
    <PlayerScreenFrame
      footer={
        <ActionButton disabled={!picked || busy} onClick={() => void commit()}>
          {index === total - 1 ? 'Selesai' : 'Selanjutnya'}
        </ActionButton>
      }
    >
      {showRing && phase.timer && (
        <TimerRing
          remainingSec={timer.remainingSec}
          totalSec={phase.timer.seconds}
          expired={timer.expired}
          size={88}
          className="mx-auto"
        />
      )}

      <div className="flex flex-col gap-4">
        <p className="text-sm text-white/60">
          Soal {index + 1} dari {total}
        </p>
        <h2 className={PROMPT_CLASS}>{renderPromptBlocks(question.prompt)}</h2>
        {question.options.map((opt, i) => (
          <LetterOption
            key={opt.id}
            letter={String.fromCharCode(65 + i)}
            label={opt.label}
            selected={picked === opt.id}
            disabled={busy}
            onClick={() => setPicked(opt.id)}
          />
        ))}
      </div>
    </PlayerScreenFrame>
  )
}
