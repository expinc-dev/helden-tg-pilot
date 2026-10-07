import { useEffect, useRef, useState } from 'react'

import { PlayerAppBar } from '@/components/PlayerAppBar'
import { PlayerWaitScreen } from '@/components/PlayerWaitScreen'
import type { Phase, PresentationContent } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { QuestionView } from '@/phases/Microlearning/PlayerPane/QuestionView'
import { isDraftValid } from '@/phases/Microlearning/PlayerPane/isDraftValid'
import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'

import { eref } from '@/lib/firebase'
import { submitAnswer } from '@/lib/sync/submitAnswer'
import { useCentralStep } from '@/lib/sync/useCentralStep'

// Presentation is host-paced, not player-paced — there's no "Next" action to
// piggyback a commit on (unlike Microlearning's single "Selanjutnya" button),
// so this pane gets its own explicit Submit button instead of QuestionView's
// usual parent-commits-on-advance pattern.
export function PresentationPlayerPane({
  content,
  sessionId,
  phaseId,
  playerId,
  teamId,
  phase,
}: {
  content: PresentationContent
  sessionId: string
  phaseId: string
  playerId: string
  teamId?: string
  phase: Phase
}) {
  const [step] = useCentralStep(sessionId)
  const bounded = Math.min(Math.max(step, 0), content.slides.length - 1)
  const slide = content.slides[bounded]
  const questionIndex = slide.blocks.findIndex((b) => b.kind === 'question')
  const questionBlock = questionIndex >= 0 ? slide.blocks[questionIndex] : undefined

  const [answer, setAnswer] = useState<unknown>(null)
  const [draft, setDraft] = useState<unknown>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const lastSlideRef = useRef(-1)

  useEffect(() => {
    if (bounded !== lastSlideRef.current) {
      lastSlideRef.current = bounded
      setAnswer(null)
      setDraft(undefined)
      setSubmitting(false)
    }
  }, [bounded])

  useEffect(() => {
    if (questionIndex < 0) return
    const qId = `${phaseId}_${slide.id}_${questionIndex}`
    return onValue(
      eref(`sessions/${sessionId}/players/${playerId}/answers/${qId}`),
      (s) => {
        if (s.val()) setAnswer(s.val().value)
      },
      { onlyOnce: true }
    )
  }, [sessionId, playerId, phaseId, slide.id, questionIndex])

  if (!questionBlock || questionBlock.kind !== 'question')
    return <PlayerWaitScreen message="Lihat Layar Utama!" />

  const isTeamMode =
    phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  const keyId = isTeamMode && teamId ? teamId : playerId
  const qId = `${phaseId}_${slide.id}_${questionIndex}`
  const answered = answer !== null
  const canSubmit = !answered && !submitting && isDraftValid(questionBlock.question, draft)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    const optionId = questionBlock.question.qType === 'single_choice' ? String(draft) : undefined
    await submitAnswer({ sessionId, playerId, keyId, qId, value: draft, optionId })
    setAnswer(draft)
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#121212] p-4 sm:p-6">
      <PlayerAppBar className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6" />
      <div className="flex-1 overflow-y-auto pt-5">
        <QuestionView
          question={questionBlock.question}
          answer={answer}
          draft={draft}
          onDraftChange={setDraft}
          disabled={answered || submitting}
          qId={qId}
          sessionId={sessionId}
          phase={phase}
          playerId={playerId}
        />
      </div>
      {answered ? (
        <p className="pt-4 text-center text-xs text-white/40">
          Jawaban terkirim. Menunggu slide berikutnya…
        </p>
      ) : (
        <ActionButton disabled={!canSubmit} onClick={handleSubmit}>
          Kirim
        </ActionButton>
      )}
    </div>
  )
}
