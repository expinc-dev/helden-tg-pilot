import { useEffect, useRef, useState } from 'react'

import { assets } from '@/assets'
import type { MicrolearningContent, Phase } from '@helden-inc/tg-schema'
import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'
import { stepRequiresAnswer } from '@/lib/sync/microStepGate'
import { submitAnswer } from '@/lib/sync/submitAnswer'
import { resolveStepTarget } from '@/lib/sync/teamStep'
import { usePlayerStep } from '@/lib/sync/usePlayerStep'
import { useTeamOwner, useTeamRole } from '@/lib/sync/useTeamRole'
import { useMyTeamId } from '@/lib/sync/useTeams'

import { StepBody } from './StepBody'
import { StepPickerGrid } from './StepPicker'
import { isDraftValid } from './isDraftValid'
import { ActionButton } from './shared'

export function PlayerPane({
  content,
  sessionId,
  playerId,
  phase,
}: {
  content: MicrolearningContent
  sessionId: string
  playerId: string
  phase: Phase
}) {
  // Team Mode: a team_leader_only member has no selfStep of their own — they
  // mirror the leader's. Resolved once, here, via the shared useTeamRole helper
  // (not re-derived per phase renderer) + the pure resolveStepTarget rule.
  const teamRole = useTeamRole(sessionId, playerId, phase)
  const teamId = useMyTeamId(sessionId, playerId)
  const leaderId = useTeamOwner(sessionId, teamId)
  const { targetPlayerId, canWrite } = resolveStepTarget(
    playerId,
    teamRole,
    leaderId,
    phase.teamMode
  )

  const [step, setStep] = usePlayerStep(sessionId, targetPlayerId, phase.syncMode)
  const bounded = Math.min(step, content.steps.length - 1)
  const current = content.steps[bounded]
  const isLastStep = bounded === content.steps.length - 1
  const gated = stepRequiresAnswer(current)

  // Within-step pagination: one block per screen. blockIndex is local, not
  // synced — reconnect drops back to blockIndex=0 within the current step
  // (persisting mid-step position would need another RTDB write path;
  // deferred, and cheap to skip because steps are short).
  const [blockIndex, setBlockIndex] = useState(0)
  const currentBlock = current.blocks[blockIndex]
  const isLastBlock = blockIndex >= current.blocks.length - 1

  // `answers` = server-committed values, recovered on reconnect (below) — the
  // source of truth for "already answered". `drafts` = local, uncommitted
  // in-progress input (a tapped choice, typed text, a dragged slider) that the
  // single "Selanjutnya" button both commits and advances past on click.
  // Both keyed by block index within the current step — the answer key on
  // RTDB is `${phase.id}_${step.id}_${blockIndex}`.
  const [answers, setAnswers] = useState<Record<number, unknown>>({})
  const [drafts, setDrafts] = useState<Record<number, unknown>>({})
  const [advancing, setAdvancing] = useState(false)
  const lastStepRef = useRef(-1)

  // null = showing the "Pilih Level" grid. A number = looking at one step's
  // card, either the live/interactive one (viewingIndex === bounded) or a
  // past one opened for review (read-only — we don't recall historical
  // per-step answers, only the current step's).
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)

  const questionBlockIndices = current.blocks.reduce<number[]>(
    (acc, b, i) => (b.kind === 'question' ? [...acc, i] : acc),
    []
  )

  useEffect(() => {
    if (bounded !== lastStepRef.current) {
      lastStepRef.current = bounded
      setAnswers({})
      setDrafts({})
      setBlockIndex(0)
    }
  }, [bounded])

  useEffect(() => {
    if (!targetPlayerId) return
    const unsubs = questionBlockIndices.map((i) =>
      onValue(
        ref(
          rtdb,
          `sessions/${sessionId}/players/${targetPlayerId}/answers/${phase.id}_${current.id}_${i}`
        ),
        (s) => {
          if (s.val()) setAnswers((prev) => ({ ...prev, [i]: s.val().value }))
        },
        { onlyOnce: true }
      )
    )
    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, targetPlayerId, bounded])

  // Gate applies only when advancing OUT of the step (past the last block).
  // Within-step Next is always enabled unless the current block itself is a
  // question that's not yet answered — a bare Next past an unanswered
  // question inside a gated step would let the player skip it.
  const currentQuestionAnswered =
    !currentBlock || currentBlock.kind !== 'question'
      ? true
      : answers[blockIndex] !== undefined || isDraftValid(currentBlock.question, drafts[blockIndex])

  const allQuestionsAnswered = questionBlockIndices.every((i) => {
    if (answers[i] !== undefined) return true
    const block = current.blocks[i]
    return block.kind === 'question' && isDraftValid(block.question, drafts[i])
  })

  const nextDisabled =
    advancing ||
    !currentQuestionAnswered ||
    (isLastBlock && isLastStep) ||
    (isLastBlock && gated && !allQuestionsAnswered)

  // Commit the CURRENT block's draft (if it's a question with a pending draft)
  // before we leave it. Called on every Next click — advancing within a step
  // also gets the answer submitted, so the server has it even if the player
  // never reaches the last block this session.
  const commitCurrentDraft = async () => {
    if (!targetPlayerId) return
    if (!currentBlock || currentBlock.kind !== 'question') return
    if (answers[blockIndex] !== undefined) return
    const draft = drafts[blockIndex]
    if (draft === undefined) return
    const question = currentBlock.question
    const optionId = question.qType === 'single_choice' ? String(draft) : undefined
    const qId = `${phase.id}_${current.id}_${blockIndex}`
    await submitAnswer({
      sessionId,
      playerId: targetPlayerId,
      keyId: targetPlayerId,
      qId,
      value: draft,
      optionId,
    })
  }

  const handleNext = async () => {
    if (!targetPlayerId || advancing) return
    setAdvancing(true)
    await commitCurrentDraft()
    if (!isLastBlock) {
      setBlockIndex(blockIndex + 1)
      setAdvancing(false)
      return
    }
    // Leaving the step: mop up any as-yet-uncommitted drafts on earlier
    // question blocks the player back-scrolled past (rare with pure forward
    // pagination, but cheap safety).
    for (const i of questionBlockIndices) {
      if (i === blockIndex) continue
      if (answers[i] !== undefined || drafts[i] === undefined) continue
      const block = current.blocks[i]
      if (block.kind !== 'question') continue
      const value = drafts[i]
      const optionId = block.question.qType === 'single_choice' ? String(value) : undefined
      const qId = `${phase.id}_${current.id}_${i}`
      await submitAnswer({
        sessionId,
        playerId: targetPlayerId,
        keyId: targetPlayerId,
        qId,
        value,
        optionId,
      })
    }
    setStep(bounded + 1)
    setAdvancing(false)
    setViewingIndex(null) // finished a step -> back to the level picker
  }

  if (viewingIndex === null) {
    return <StepPickerGrid content={content} bounded={bounded} onSelect={setViewingIndex} />
  }

  if (viewingIndex !== bounded) {
    // Reviewing an already-completed step — show its full block list at once
    // (no per-block pagination in review mode; the player already walked
    // through it interactively, this is just a scrollable snapshot).
    const step = content.steps[viewingIndex]
    return (
      <StepShell>
        <StepBody
          stepId={step.id}
          blocks={step.blocks}
          header={null}
          answers={{}}
          drafts={{}}
          onDraftChange={() => {}}
          disabled
          sessionId={sessionId}
          phase={phase}
          playerId={playerId}
          imageVariant="contained"
        />
      </StepShell>
    )
  }

  // Live/interactive step: paginate one block per screen. StepBody accepts
  // Block[] because Presentation shares this component; passing a
  // single-element array shows exactly one block per Next click.
  const nextLabel = isLastBlock && isLastStep ? 'Selesai' : 'Selanjutnya'
  return (
    <StepShell
      footer={
        canWrite ? (
          <ActionButton disabled={nextDisabled} onClick={handleNext}>
            {nextLabel}
          </ActionButton>
        ) : (
          <p className="text-center text-xs text-white/40">Your team leader controls Next.</p>
        )
      }
    >
      <StepBody
        stepId={`${current.id}-${blockIndex}`}
        blocks={currentBlock ? [currentBlock] : []}
        header={
          // canWrite, not teamRole — team_collaborative members are still
          // 'member' but have full independent control, unlike team_leader_only
          // members who only mirror the leader (canWrite: false).
          !canWrite ? (
            <p className="mb-2 text-xs text-white/40">Following your team leader</p>
          ) : null
        }
        answers={answers[blockIndex] !== undefined ? { 0: answers[blockIndex] } : {}}
        drafts={drafts[blockIndex] !== undefined ? { 0: drafts[blockIndex] } : {}}
        onDraftChange={(_i, value) => setDrafts((prev) => ({ ...prev, [blockIndex]: value }))}
        disabled={!canWrite || advancing}
        sessionId={sessionId}
        phase={phase}
        playerId={playerId}
        imageVariant="contained"
      />
    </StepShell>
  )
}

// Same background-image + rounded/bordered card frame as StepPickerGrid and
// the host's MonitorPane, so a step card doesn't look like a completely
// different screen from the picker it was opened from.
function StepShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-cover bg-top p-4 sm:p-6"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="p-4 pt-0 sm:p-6 sm:pt-0">{footer}</div>}
      </div>
    </div>
  )
}
