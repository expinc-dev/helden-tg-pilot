import { useEffect, useRef, useState } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'
import { submitAnswer } from '@/lib/sync/submitAnswer'
import { useQuizStep } from '@/lib/sync/useQuizStep'
import { useTimer } from '@/lib/sync/useTimer'

import { type QuizContent, questionOptions, resolveTimers, usePlayerScore } from '../lib'
import { isScaleQuestion, scaleOptionId, scalePoints } from '../scale'
import { AnsweringStage } from './components/AnsweringStage'
import { RevealStage } from './components/RevealStage'
import { ScaleStage } from './components/ScaleStage'

export function PlayerQuiz({
  content,
  sessionId,
  phaseId,
  playerId,
  teamId,
  phase,
}: {
  content: QuizContent
  sessionId: string
  phaseId: string
  playerId: string
  teamId?: string
  phase: Phase
}) {
  const { quizStep } = useQuizStep(sessionId)
  const timer = useTimer(sessionId, phase)
  const q = content.questions[quizStep.step]
  const myScore = usePlayerScore(sessionId, playerId, phase)
  // string for choice questions (option id), number for scale questions (the
  // point value). Both round-trip through RTDB verbatim, so the reconnect
  // recovery below must not assume a string.
  const [submitted, setSubmitted] = useState<string | number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const lastStepRef = useRef(-1)
  const timers = resolveTimers(content)

  useEffect(() => {
    if (quizStep.step !== lastStepRef.current) {
      lastStepRef.current = quizStep.step
      setSubmitted(null)
      setSubmitting(false)
      setSelectedId(null)
      setSelectedValue(null)
    }
  }, [quizStep.step])

  useEffect(() => {
    const qId = `${phaseId}_q${quizStep.step}`
    return onValue(
      eref(`sessions/${sessionId}/players/${playerId}/answers/${qId}`),
      (s) => {
        const v = s.val()?.value
        if (v !== undefined && v !== null) setSubmitted(v as string | number)
      },
      { onlyOnce: true }
    )
  }, [sessionId, playerId, phaseId, quizStep.step])

  if (!q) return null

  const isTeamMode =
    phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  const keyId = isTeamMode && teamId ? teamId : playerId
  const qId = `${phaseId}_q${quizStep.step}`

  const handleAnswer = async (optionId: string) => {
    if (submitted !== null || submitting) return
    setSelectedId(optionId)
    setSubmitting(true)
    await submitAnswer({ sessionId, playerId, keyId, qId, value: optionId, optionId })
    setSubmitted(optionId)
    setSubmitting(false)
  }

  // Scale answer (on_device attitude quiz): the number IS the value, and its
  // string form is the distribution bucket — so `LiveAggregates.distribution`
  // gets one bucket per point without any schema change.
  const handleScaleAnswer = async (value: number) => {
    if (submitted !== null || submitting) return
    setSelectedValue(value)
    setSubmitting(true)
    await submitAnswer({
      sessionId,
      playerId,
      keyId,
      qId,
      value,
      optionId: scaleOptionId(value),
    })
    setSubmitted(value)
    setSubmitting(false)
  }

  const canAnswer =
    quizStep.stage === 'answering' && !timer.expired && submitted === null && !submitting

  if (isScaleQuestion(q)) {
    return (
      <ScaleStage
        question={q}
        points={scalePoints(q)}
        submitted={submitted}
        selectedValue={selectedValue}
        canAnswer={canAnswer}
        onAnswer={handleScaleAnswer}
      />
    )
  }

  if (quizStep.stage === 'answering') {
    return (
      <AnsweringStage
        timer={timer}
        timers={timers}
        step={quizStep.step}
        total={content.questions.length}
        submitted={typeof submitted === 'string' ? submitted : null}
        selectedId={selectedId}
        canAnswer={canAnswer}
        options={questionOptions(q)}
        onAnswer={handleAnswer}
      />
    )
  }

  return (
    <RevealStage
      submitted={typeof submitted === 'string' ? submitted : null}
      isCorrect={submitted === quizStep.correctId}
      myScore={myScore}
    />
  )
}
