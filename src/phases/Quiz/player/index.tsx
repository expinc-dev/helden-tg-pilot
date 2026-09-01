import { useEffect, useRef, useState } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'
import { submitAnswer } from '@/lib/sync/submitAnswer'
import { useQuizStep } from '@/lib/sync/useQuizStep'
import { useTimer } from '@/lib/sync/useTimer'

import { type QuizContent, questionOptions, resolveTimers, usePlayerScore } from '../lib'
import { AnsweringStage } from './components/AnsweringStage'
import { RevealStage } from './components/RevealStage'

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
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const lastStepRef = useRef(-1)
  const timers = resolveTimers(content)

  useEffect(() => {
    if (quizStep.step !== lastStepRef.current) {
      lastStepRef.current = quizStep.step
      setSubmitted(null)
      setSubmitting(false)
      setSelectedId(null)
    }
  }, [quizStep.step])

  useEffect(() => {
    const qId = `${phaseId}_q${quizStep.step}`
    return onValue(
      eref(`sessions/${sessionId}/players/${playerId}/answers/${qId}`),
      (s) => {
        if (s.val()) setSubmitted(s.val().value as string)
      },
      { onlyOnce: true }
    )
  }, [sessionId, playerId, phaseId, quizStep.step])

  if (!q) return null

  const isTeamMode =
    phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  const keyId = isTeamMode && teamId ? teamId : playerId

  const handleAnswer = async (optionId: string) => {
    if (submitted || submitting) return
    setSelectedId(optionId)
    setSubmitting(true)
    const qId = `${phaseId}_q${quizStep.step}`
    await submitAnswer({ sessionId, playerId, keyId, qId, value: optionId, optionId })
    setSubmitted(optionId)
    setSubmitting(false)
  }

  const canAnswer = quizStep.stage === 'answering' && !timer.expired && !submitted && !submitting

  if (quizStep.stage === 'answering') {
    return (
      <AnsweringStage
        timer={timer}
        timers={timers}
        step={quizStep.step}
        total={content.questions.length}
        submitted={submitted}
        selectedId={selectedId}
        canAnswer={canAnswer}
        options={questionOptions(q)}
        onAnswer={handleAnswer}
      />
    )
  }

  return (
    <RevealStage
      submitted={submitted}
      isCorrect={submitted === quizStep.correctId}
      myScore={myScore}
    />
  )
}
