import type { Phase, Question } from '@helden-inc/tg-schema'

import { renderPromptBlocks } from '@/lib/richText'

import { ImageSequenceView } from './ImageSequenceQuestion'
import { OrderQuestionView } from './OrderQuestion'
import { ScanQuestion } from './ScanQuestion'
import { SectionHeading } from './shared'
import { usePatternDetector, useQrDetector } from './useScanDetector'

// Selectable row shared by single/multi choice — dark bordered card with a
// radio-style dot on the left. The Figma uses the same round indicator for
// both single- and multi-select questions. Border stays the same muted grey
// in both states; only the background gets a soft yellow tint plus the
// indicator fills gold when selected — text stays white throughout.
function OptionRow({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm text-white/80 transition disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        borderColor: '#99A3AE',
        background: selected
          ? 'linear-gradient(0deg, rgba(253, 219, 0, 0.16) 0%, rgba(253, 219, 0, 0.16) 100%), #1F1F1F'
          : '#1F1F1F',
      }}
    >
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-full border"
        style={{ borderColor: selected ? '#FDDB00' : '#99A3AE' }}
      >
        {selected && <span className="size-2 rounded-full" style={{ background: '#FDDB00' }} />}
      </span>
      {label}
    </button>
  )
}

// Ungraded, formative check for every qType except qr_scan/pattern_scan
// (those two DO have an answer key + scoring, checked client-side against a
// physical puzzle — see ScanQuestion/scanScoring.ts). Fully controlled by
// the parent: `draft` is the uncommitted local pick/text/slider value,
// `answer` is the server-committed one (set after reconnect recovery or once
// the outer "Selanjutnya" commits it). No submit button here — the design
// has exactly one action per card, so committing happens when the parent's
// Next button fires (except the scan retry loop, which is self-contained).
export function QuestionView({
  question,
  answer,
  draft,
  onDraftChange,
  disabled,
  sessionId,
  phase,
  playerId,
}: {
  question: Question
  answer: unknown
  draft: unknown
  onDraftChange: (value: unknown) => void
  disabled: boolean
  // Only consumed by qr_scan/pattern_scan (need to write their own score
  // deltas per attempt — see lib/session/scanScoring.ts) — every other
  // qType here is ungraded and ignores these.
  sessionId: string
  phase: Phase
  playerId: string
}) {
  const prompt = renderPromptBlocks(question.prompt)
  const answered = answer !== null
  const current = answered ? answer : draft
  const locked = disabled || answered

  // Hooks must run unconditionally regardless of which qType branch below
  // actually uses them (Rules of Hooks) — inert args when not applicable.
  const qrDetect = useQrDetector(question.qType === 'qr_scan' ? question.expectedValue : '')
  const patternDetect = usePatternDetector(
    question.qType === 'pattern_scan' ? question.targetUrl : undefined
  )

  if (question.qType === 'single_choice') {
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading text={prompt} />
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt) => (
            <OptionRow
              key={opt.id}
              label={opt.label}
              selected={current === opt.id}
              disabled={locked}
              onClick={() => onDraftChange(opt.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  if (question.qType === 'multi_choice') {
    const shown = Array.isArray(current) ? (current as string[]) : []
    const toggle = (id: string) =>
      onDraftChange(shown.includes(id) ? shown.filter((p) => p !== id) : [...shown, id])
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading text={prompt} />
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt) => (
            <OptionRow
              key={opt.id}
              label={opt.label}
              selected={shown.includes(opt.id)}
              disabled={locked}
              onClick={() => toggle(opt.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  if (question.qType === 'scale') {
    const value = typeof current === 'number' ? current : question.min
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading text={prompt} />
        <div className="rounded-xl border border-white/10 bg-[#1C1C1E] p-4">
          <input
            type="range"
            min={question.min}
            max={question.max}
            value={value}
            disabled={locked}
            onChange={(e) => onDraftChange(Number(e.target.value))}
            className="w-full accent-[#FFB800]"
          />
          <div className="mt-2 flex justify-between text-xs text-white/40">
            <span>{question.labels?.[0] ?? question.min}</span>
            <span className="font-semibold text-[#FFB800]">{value}</span>
            <span>{question.labels?.[1] ?? question.max}</span>
          </div>
        </div>
      </div>
    )
  }

  if (question.qType === 'order') {
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading text={prompt} />
        <OrderQuestionView
          question={question}
          draft={current}
          onDraftChange={onDraftChange}
          disabled={locked}
        />
      </div>
    )
  }

  if (question.qType === 'image_sequence') {
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading text={prompt} />
        <ImageSequenceView
          question={question}
          draft={current}
          onDraftChange={onDraftChange}
          disabled={locked}
        />
      </div>
    )
  }

  if (question.qType === 'qr_scan') {
    return (
      <ScanQuestion
        prompt={prompt}
        imageUrl={question.referenceUrl}
        points={question.points}
        detect={qrDetect}
        answer={answer}
        draft={draft}
        onDraftChange={onDraftChange}
        disabled={disabled}
        sessionId={sessionId}
        phase={phase}
        playerId={playerId}
      />
    )
  }

  if (question.qType === 'pattern_scan') {
    return (
      <ScanQuestion
        prompt={prompt}
        imageUrl={question.targetUrl}
        points={question.points}
        detect={patternDetect}
        answer={answer}
        draft={draft}
        onDraftChange={onDraftChange}
        disabled={disabled}
        sessionId={sessionId}
        phase={phase}
        playerId={playerId}
      />
    )
  }

  // open_text / short_answer — free text, no grading here.
  const text = typeof current === 'string' ? current : ''
  return (
    <div className="flex flex-col gap-3">
      <SectionHeading text={prompt} />
      <textarea
        value={text}
        disabled={locked}
        maxLength={question.qType === 'open_text' ? question.maxLen : undefined}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder="Typ hier je reactie..."
        rows={4}
        className="rounded-xl border border-white/10 bg-[#1C1C1E] p-3 text-sm text-white placeholder:text-white/30 disabled:opacity-40"
      />
    </div>
  )
}
