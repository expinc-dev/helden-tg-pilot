import { useState } from 'react'

import type { Question } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'

import { copyToClipboard } from '@/lib/clipboard'
import { renderPromptBlocks } from '@/lib/richText'
import { submitAnswer } from '@/lib/sync/submitAnswer'

import { ActionButton, SectionHeading } from './shared'

type PromptBuilderQuestion = Extract<Question, { qType: 'prompt_builder' }>
type Path = PromptBuilderQuestion['paths'][number]
type FieldValues = Record<string, string>
// One player's progress on this question: which paths they've already
// completed, keyed by path id, value = their submitted field values for that
// path. Stored as the single `value` of this block's playerAnswer (same qId
// convention as every other qType — see submitAnswer.ts) — but unlike every
// other qType, which submits one scalar `draft` when the step's outer "Next"
// is pressed, this `value` is the FULL merged map, re-submitted (not patched)
// on every path, because submitAnswer does a plain `set()` at
// `answers/{qId}` — the caller is responsible for merging, not RTDB. Same
// architecture as PathQuestion.tsx's CaseAnswers, just one field-map per path
// instead of one string per case.
type PathAnswers = Record<string, FieldValues>

// No in-app AI call by design (BRIGHT-959) — the player copies this prompt
// and pastes it into Gemini themselves. Fixed by convention, not authored:
// this qType's whole purpose is the external bridge to this one destination.
const GEMINI_URL = 'https://gemini.google.com'

// Unmatched `{fieldId}` (a typo, or a field since removed) is left as empty
// string rather than the literal placeholder text — CMS's publishValidate
// (registry.ts) already hard-fails this at publish time, so it should never
// happen with a validly-published bundle; this is just a safe runtime fallback.
function assemblePrompt(template: string, values: FieldValues): string {
  return template.replace(/\{([^}]+)\}/g, (_match, fieldId: string) => values[fieldId] ?? '')
}

const CARD_GRADIENT = 'linear-gradient(252deg, #565656 -38.22%, #000 41.21%)'

// One path's box in the picker grid. Deliberately identical markup/styling
// for every path regardless of `hidden` — the parent only ever passes paths
// that are CURRENTLY meant to be visible (non-hidden, or hidden-and-unlocked —
// see `visiblePaths` below), so nothing here can tip a player off that a path
// is "the bonus one". `done` is the only thing that changes the look, same
// as any other path the player already completed.
function PathCard({
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

// One open path's form: labeled fields (each shows `example` in place until
// filled — no "already filled from your earlier answer" state yet, that's
// Persist-seeds, a separate not-yet-built story), a live-assembled prompt
// preview, Copy + open-Gemini controls, and a submit button gated on every
// field being filled. `values` seeds once from `existingAnswer` at mount
// (same initializer-only pattern as PathQuestion's CaseTaskView) — the caller
// keys this component by path id (see PromptBuilderView below) so opening a
// different path remounts it fresh instead of needing an effect to reset it.
function PathFormView({
  path,
  existingAnswer,
  disabled,
  onBack,
  onSubmit,
}: {
  path: Path
  existingAnswer: FieldValues | undefined
  disabled: boolean
  onBack: () => void
  // Resolves once the write is confirmed (or has failed and been reported
  // via toast — see PromptBuilderView below); never rejects, so this never
  // needs its own try/catch.
  onSubmit: (values: FieldValues) => Promise<void>
}) {
  const [values, setValues] = useState<FieldValues>(existingAnswer ?? {})
  const [submitting, setSubmitting] = useState(false)
  const answered = existingAnswer !== undefined
  const locked = disabled || answered || submitting

  const setValue = (fieldId: string, value: string) =>
    setValues((prev) => ({ ...prev, [fieldId]: value }))

  const assembled = assemblePrompt(path.promptTemplate, values)
  const allFilled = path.fields.every((f) => (values[f.id] ?? '').trim().length > 0)

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit(values)
    // On success the parent unmounts this view (back to the picker) as part
    // of that same call, so this line only actually matters on failure —
    // harmless no-op on an already-unmounted component otherwise (React 19).
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
      >
        <Icon icon="mdi:chevron-left" className="size-4" />
        Kembali ke Daftar Jalur
      </button>

      <SectionHeading text={path.label} />

      <div className="flex flex-col gap-3">
        {path.fields.map((f) => {
          const value = values[f.id] ?? ''
          return (
            <div key={f.id} className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-white">{f.label}</label>
              <textarea
                value={value}
                disabled={locked}
                maxLength={f.maxLen}
                onChange={(e) => setValue(f.id, e.target.value)}
                rows={2}
                className="rounded-xl border border-white/10 bg-[#1C1C1E] p-3 text-sm text-white placeholder:text-white/30 disabled:opacity-40"
              />
              {!value && <p className="text-xs text-white/40 italic">contoh: {f.example}</p>}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#1C1C1E] p-3">
        <p className="text-xs font-semibold text-white/60">Prompt siap disalin</p>
        <p className="max-h-32 overflow-y-auto text-xs whitespace-pre-wrap text-white/80">
          {assembled}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void copyToClipboard(assembled)}
          disabled={!assembled}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FFB800] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
        >
          Copy prompt
        </button>
        <a
          href={GEMINI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Buka Gemini
          <Icon icon="mdi:open-in-new" className="size-4" />
        </a>
      </div>

      {!answered && (
        <ActionButton onClick={() => void handleSubmit()} disabled={locked || !allFilled}>
          {submitting ? 'Mengirim…' : 'Selesai Jalur Ini'}
        </ActionButton>
      )}
    </div>
  )
}

// Ungraded, formative, same family as path_question — a path picker rather
// than a single input, and the participant may do 1-or-more (not all) of the
// non-hidden paths. Internal `openPathId` state switches between the picker
// grid and a path's form, mirroring PathQuestion's local popup/result state.
//
// Submit timing is deliberately DIFFERENT from most qTypes here (open_text,
// single_choice, etc. wait for the step's outer "Next" — PlayerPane's
// deferred commitCurrentDraft): this submits straight to RTDB the moment a
// path is completed, same architectural choice as PathQuestion.tsx. Reason:
// the player may do 2 of 4 paths then move on without ever reaching "Next"
// for the step (there is no "step" here to advance past — completing paths
// IS the whole activity), so deferring would risk losing every path they
// finished along the way. Confirm-then-advance, not optimistic — see
// PathFormView's onSubmit above for why.
//
// Reveal logic: `visiblePaths` is a pure function of the current answers —
// no "revealed" flag is ever written anywhere (mirrors PathQuestion.tsx's
// precedent). Recomputed on every render, so a hidden path appears the
// instant its threshold is met, no reconnect/refresh needed.
export function PromptBuilderView({
  question,
  answer,
  draft,
  onDraftChange,
  disabled,
  qId,
  sessionId,
  playerId,
}: {
  question: PromptBuilderQuestion
  answer: unknown
  draft: unknown
  onDraftChange: (value: unknown) => void
  disabled: boolean
  qId: string
  sessionId: string
  playerId: string
}) {
  const prompt = renderPromptBlocks(question.prompt)
  const answers = ((answer ?? draft) as PathAnswers | null) ?? {}
  const [openPathId, setOpenPathId] = useState<string | null>(null)

  const nonHiddenPaths = question.paths.filter((p) => !p.hidden)
  const nonHiddenCompletedCount = nonHiddenPaths.filter((p) => p.id in answers).length
  const hiddenPathsUnlocked = nonHiddenCompletedCount >= question.unlockAfterPaths
  // Once unlocked, the FULL authored list shows (hidden paths included, in
  // their original authored position) — not just the hidden ones appended,
  // so a hidden path placed mid-list doesn't jump to the end and give itself
  // away by its position alone.
  const visiblePaths = hiddenPathsUnlocked ? question.paths : nonHiddenPaths
  const openPath = question.paths.find((p) => p.id === openPathId)

  if (openPath) {
    return (
      <PathFormView
        key={openPath.id}
        path={openPath}
        existingAnswer={answers[openPath.id]}
        disabled={disabled}
        onBack={() => setOpenPathId(null)}
        onSubmit={async (values) => {
          const nextAnswers: PathAnswers = { ...answers, [openPath.id]: values }
          try {
            await submitAnswer({
              sessionId,
              playerId,
              keyId: playerId, // teamMode: individual — no team aggregation here.
              qId,
              value: nextAnswers,
            })
            onDraftChange(nextAnswers)
            setOpenPathId(null)
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
        {visiblePaths.map((p, i) => (
          <PathCard
            key={p.id}
            label={p.label}
            index={i}
            done={p.id in answers}
            disabled={disabled}
            onSelect={() => setOpenPathId(p.id)}
          />
        ))}
      </div>
    </div>
  )
}
