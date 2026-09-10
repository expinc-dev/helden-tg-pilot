import { useState } from 'react'

import type { Phase, Question } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'

import { renderPromptBlocks } from '@/lib/richText'
import { submitAnswer } from '@/lib/sync/submitAnswer'

import { BlockView } from './Blocks'
import { ActionButton, SectionHeading } from './shared'

type PathQuestion = Extract<Question, { qType: 'path_question' }>
type Case = PathQuestion['cases'][number]
// One player's progress on this question: which cases they've already
// answered, keyed by case id, value = their submitted open text. Stored as
// the single `value` of this block's playerAnswer (same qId convention as
// every other qType — see submitAnswer.ts) — but unlike every other qType,
// which submits one scalar `draft` when the step's outer "Next" is pressed,
// this `value` is the FULL merged map, re-submitted (not patched) on every
// case, because submitAnswer does a plain `set()` at `answers/{qId}` — the
// caller is responsible for merging, not RTDB.
type CaseAnswers = Record<string, string>

const CARD_GRADIENT = 'linear-gradient(252deg, #565656 -38.22%, #000 41.21%)'

// One case's box in the picker grid. Deliberately identical markup/styling
// for every case regardless of `hidden` — the parent only ever passes cases
// that are CURRENTLY meant to be visible (non-hidden, or hidden-and-unlocked —
// see `visibleCases` below), so nothing here can tip a player off that a case
// is "the bonus one". `done` is the only thing that changes the look, same
// as any other case the player already completed.
function CaseCard({
  label,
  index,
  done,
  disabled,
  onSelect,
}: {
  label: string
  index: number
  done: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-lg p-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        border: done ? '0.5px solid #FDDB00' : '0.5px solid rgba(255, 255, 255, 0.15)',
        background: CARD_GRADIENT,
        boxShadow: done ? '0 0 12px 0 rgba(253, 164, 0, 0.20)' : undefined,
      }}
    >
      {done && (
        <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-[#22C55E] text-white">
          <Icon icon="mdi:check" className="size-4" />
        </span>
      )}
      <span className="text-2xl font-black text-[#FFB800]">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="text-xs font-semibold text-white">{label}</span>
    </button>
  )
}

// One open case's task view: task content (Block[], read-only display —
// CMS's PathQuestionEditor authors it with allowQuestion off, so nothing
// here is ever itself interactive/answerable) followed by an open-text
// answer box. `text` seeds once from `existingAnswer` at mount (same
// initializer-only pattern as ScanQuestion's `result` state) — the caller
// keys this component by case id (see PathQuestionView below) so opening a
// different case remounts it fresh instead of needing an effect to reset it.
function CaseTaskView({
  caseItem,
  existingAnswer,
  disabled,
  sessionId,
  phase,
  playerId,
  onBack,
  onSubmit,
}: {
  caseItem: Case
  existingAnswer: string | undefined
  disabled: boolean
  sessionId: string
  phase: Phase
  playerId: string
  onBack: () => void
  // Resolves once the write is confirmed (or has failed and been reported
  // via toast — see PathQuestionView below); never rejects, so this never
  // needs its own try/catch.
  onSubmit: (text: string) => Promise<void>
}) {
  const [text, setText] = useState(existingAnswer ?? '')
  const [submitting, setSubmitting] = useState(false)
  const answered = existingAnswer !== undefined
  const locked = disabled || answered || submitting

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit(text)
    // On success the parent unmounts this view (back to the picker) as part
    // of that same call, so this line only actually matters on failure —
    // harmless no-op on an already-unmounted component otherwise (React 19).
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
      >
        <Icon icon="mdi:chevron-left" className="size-4" />
        Kembali ke Daftar Case
      </button>

      <SectionHeading text={caseItem.label} />

      <div className="flex flex-col gap-4">
        {caseItem.task.map((block, i) => (
          <BlockView
            key={i}
            block={block}
            answer={null}
            draft={null}
            onDraftChange={() => {}}
            disabled={disabled}
            // Inert — same reasoning as answer/draft/onDraftChange above:
            // case.task is authored with allowQuestion off (PathQuestionEditor
            // in the CMS), so none of these blocks can ever be a 'question'
            // that would actually read this.
            qId="path_question_task_content"
            sessionId={sessionId}
            phase={phase}
            playerId={playerId}
          />
        ))}
      </div>

      <textarea
        value={text}
        disabled={locked}
        maxLength={caseItem.maxLen}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tulis jawabanmu di sini..."
        rows={4}
        className="rounded-xl border border-white/10 bg-[#1C1C1E] p-3 text-sm text-white placeholder:text-white/30 disabled:opacity-40"
      />

      {!answered && (
        <ActionButton onClick={() => void handleSubmit()} disabled={locked || text.trim() === ''}>
          {submitting ? 'Mengirim…' : 'Kirim Jawaban'}
        </ActionButton>
      )}
    </div>
  )
}

// Ungraded, formative, same family as every other microlearning qType
// (QuestionView.tsx's header comment) — a case picker rather than a single
// input. Internal `openCaseId` state switches between the picker grid and a
// case's task view, mirroring ScanQuestion's local popup/result state.
//
// Submit timing is deliberately DIFFERENT from every other qType here: those
// wait for the step's outer "Next" (PlayerPane's deferred commitCurrentDraft).
// This submits straight to RTDB the moment a case is answered — same
// architectural choice as ScanQuestion calling awardScanPoints directly,
// just for the main answer instead of a score side-channel. Reason: this is
// bonus content a player may poke at then abandon without ever reaching
// "Next" for the step, so deferring would risk losing every case they
// answered along the way. Confirm-then-advance, not optimistic — see
// CaseTaskView's onSubmit above for why.
//
// Reveal logic: `visibleCases` is a pure function of the current answers —
// no "revealed" flag is ever written anywhere (mirrors StepPicker.tsx's
// stepStatus(), the existing precedent for this kind of derived-not-stored
// gating in this codebase). Recomputed on every render, so a hidden case
// appears the instant its threshold is met, no reconnect/refresh needed —
// and with zero visual distinction from CaseCard's perspective (it's just
// another entry in the same array), satisfying "no highlight/announcement".
export function PathQuestionView({
  question,
  answer,
  draft,
  onDraftChange,
  disabled,
  qId,
  sessionId,
  phase,
  playerId,
}: {
  question: PathQuestion
  answer: unknown
  draft: unknown
  onDraftChange: (value: unknown) => void
  disabled: boolean
  qId: string
  sessionId: string
  phase: Phase
  playerId: string
}) {
  const prompt = renderPromptBlocks(question.prompt)
  const answers = ((answer ?? draft) as CaseAnswers | null) ?? {}
  const [openCaseId, setOpenCaseId] = useState<string | null>(null)

  const nonHiddenCases = question.cases.filter((c) => !c.hidden)
  const nonHiddenCompletedCount = nonHiddenCases.filter((c) => c.id in answers).length
  const hiddenCasesUnlocked = nonHiddenCompletedCount >= question.unlockAfterCases
  // Once unlocked, the FULL authored list shows (hidden cases included, in
  // their original authored position) — not just the hidden ones appended,
  // so a hidden case placed mid-list doesn't jump to the end and give itself
  // away by its position alone.
  const visibleCases = hiddenCasesUnlocked ? question.cases : nonHiddenCases
  const openCase = question.cases.find((c) => c.id === openCaseId)

  if (openCase) {
    return (
      <CaseTaskView
        key={openCase.id}
        caseItem={openCase}
        existingAnswer={answers[openCase.id]}
        disabled={disabled}
        sessionId={sessionId}
        phase={phase}
        playerId={playerId}
        onBack={() => setOpenCaseId(null)}
        onSubmit={async (text) => {
          const trimmed = text.trim()
          const nextAnswers: CaseAnswers = { ...answers, [openCase.id]: trimmed }
          // Confirm-then-advance, NOT optimistic: an earlier version updated
          // local draft immediately and fired the RTDB write in the
          // background, un-awaited. QA caught the real cost of that — a
          // failed write (e.g. a rules mismatch) looked identical to success
          // in the current tab, and only surfaced as fully lost progress on
          // reload. So now the picker's checkmark, and leaving this case,
          // both wait for the write to actually be confirmed.
          try {
            await submitAnswer({
              sessionId,
              playerId,
              keyId: playerId, // teamMode: individual — no team aggregation here.
              qId,
              value: nextAnswers,
            })
            onDraftChange(nextAnswers)
            setOpenCaseId(null)
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            toast.error(`Gagal menyimpan jawaban: ${msg}`)
          }
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionHeading text={prompt} />
      <div className="grid grid-cols-2 gap-3">
        {visibleCases.map((c, i) => (
          <CaseCard
            key={c.id}
            label={c.label}
            index={i}
            done={c.id in answers}
            disabled={disabled}
            onSelect={() => setOpenCaseId(c.id)}
          />
        ))}
      </div>
    </div>
  )
}
