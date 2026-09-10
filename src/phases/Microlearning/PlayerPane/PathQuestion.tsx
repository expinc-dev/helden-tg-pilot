import { useState } from 'react'

import type { Phase, Question } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { renderPromptBlocks } from '@/lib/richText'

import { BlockView } from './Blocks'
import { ActionButton, SectionHeading } from './shared'

type PathQuestion = Extract<Question, { qType: 'path_question' }>
type Case = PathQuestion['cases'][number]
// One player's progress on this question: which cases they've already
// answered, keyed by case id, value = their submitted open text. Stored as
// the single `value` of this block's playerAnswer (same qId convention as
// every other qType — see submitAnswer.ts), merged in per-case as each one
// is submitted rather than replaced wholesale (subtask 6).
type CaseAnswers = Record<string, string>

const CARD_GRADIENT = 'linear-gradient(252deg, #565656 -38.22%, #000 41.21%)'

// One case's box in the picker grid. Deliberately identical markup/styling
// for every case regardless of `hidden` — the parent only ever passes cases
// that are currently meant to be visible (non-hidden, or hidden-and-unlocked
// once reveal logic lands in subtask 7), so nothing here can tip a player off
// that a case is "the bonus one". `done` is the only thing that changes the
// look, same as any other case the player already completed.
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
  onSubmit: (text: string) => void
}) {
  const [text, setText] = useState(existingAnswer ?? '')
  const answered = existingAnswer !== undefined
  const locked = disabled || answered

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
        <ActionButton onClick={() => onSubmit(text)} disabled={locked || text.trim() === ''}>
          Kirim Jawaban
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
// Scope note: the hidden-case reveal-after-threshold logic (subtask 7) isn't
// here yet — `visibleCases` only ever shows non-hidden cases for now.
// Submitting a case's answer (below) doesn't persist anywhere yet either —
// it just returns to the picker. The real per-case `submitAnswer` call +
// RTDB write, merged into the shared answers map, lands in subtask 6.
export function PathQuestionView({
  question,
  answer,
  draft,
  // Not wired yet — real per-case submission lands in subtask 6 (direct
  // submitAnswer call on each case's submit, not this generic callback; see
  // ScanQuestion's awardScanPoints precedent). `_`-renamed for tsc's
  // noUnusedParameters (only exempts underscore-prefixed names) + disabled
  // for eslint (this repo doesn't configure argsIgnorePattern). Drop both
  // once subtask 6 actually uses it.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDraftChange: _onDraftChange,
  disabled,
  sessionId,
  phase,
  playerId,
}: {
  question: PathQuestion
  answer: unknown
  draft: unknown
  onDraftChange: (value: unknown) => void
  disabled: boolean
  sessionId: string
  phase: Phase
  playerId: string
}) {
  const prompt = renderPromptBlocks(question.prompt)
  const answers = ((answer ?? draft) as CaseAnswers | null) ?? {}
  const [openCaseId, setOpenCaseId] = useState<string | null>(null)

  const visibleCases = question.cases.filter((c) => !c.hidden)
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
        onSubmit={() => {
          // subtask 6 wires the real submitAnswer + merged RTDB write here.
          setOpenCaseId(null)
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
