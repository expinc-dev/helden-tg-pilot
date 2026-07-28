import { useEffect, useRef, useState } from 'react'

import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { HeldenLogoLotties } from '@/components/HeldenLogoLotties'
import type { Phase, PresentationContent } from '@helden-inc/tg-schema'
import { onValue, ref } from 'firebase/database'

import { QuestionView } from '@/phases/Microlearning/PlayerPane/QuestionView'
import { isDraftValid } from '@/phases/Microlearning/PlayerPane/isDraftValid'
import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'

import { rtdb } from '@/lib/firebase'
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
      ref(rtdb, `sessions/${sessionId}/players/${playerId}/answers/${qId}`),
      (s) => {
        if (s.val()) setAnswer(s.val().value)
      },
      { onlyOnce: true }
    )
  }, [sessionId, playerId, phaseId, slide.id, questionIndex])

  if (!questionBlock || questionBlock.kind !== 'question') return <WatchScreenPane />

  const isTeamMode =
    phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  const keyId = isTeamMode && teamId ? teamId : playerId
  const answered = answer !== null
  const canSubmit = !answered && !submitting && isDraftValid(questionBlock.question, draft)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    const qId = `${phaseId}_${slide.id}_${questionIndex}`
    const optionId = questionBlock.question.qType === 'single_choice' ? String(draft) : undefined
    await submitAnswer({ sessionId, playerId, keyId, qId, value: draft, optionId })
    setAnswer(draft)
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#121212] p-4 sm:p-6">
      <FullscreenToggle position="absolute" />
      <div className="flex-1 overflow-y-auto pt-8">
        <QuestionView
          question={questionBlock.question}
          answer={answer}
          draft={draft}
          onDraftChange={setDraft}
          disabled={answered || submitting}
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

function WatchScreenPane() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center bg-neutral-950 bg-center p-6"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <FullscreenToggle position="absolute" />
      <HeldenLogoLotties className="h-6 w-auto self-start" />

      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p
          className="text-xl font-bold text-white"
          style={{ textShadow: '0 0 16px rgba(255, 255, 255, 0.5)' }}
        >
          Lihat layar utama
        </p>
        <p className="text-sm text-white/60">Perhatikan presentasi di layar utama.</p>
      </div>
    </div>
  )
}
