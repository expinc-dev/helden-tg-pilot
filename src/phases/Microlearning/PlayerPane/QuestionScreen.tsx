import { LetterOption } from '@/components/LetterOption'
import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'
import type { Phase, Question } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { TimerRing } from '@/phases/Quiz/TimerRing'

import { renderPromptBlocks } from '@/lib/richText'
import { useTimer } from '@/lib/sync/useTimer'

import { ActionButton } from './shared'
import { isOtherLabel, otherDisplayLabel } from './simpleFlow'

const BORDER = '#353535'

const ScreenFrame = PlayerScreenFrame

export function QuestionDoneScreen() {
  return (
    <ScreenFrame>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#26890C]/20">
          <Icon icon="mdi:check-circle" className="size-10 text-[#26890C]" />
        </div>
        <p className="text-xl font-semibold text-white">Jawabanmu sudah terkumpul!</p>
        <p className="text-white/40">Menunggu fase berikutnya...</p>
      </div>
    </ScreenFrame>
  )
}

// One question per screen (design: timer ring, prompt, lettered options /
// big textarea, action button below the card). Fully controlled — commit and
// advance stay in PlayerPane.
export function QuestionScreen({
  question,
  phase,
  sessionId,
  answer,
  draft,
  onDraftChange,
  disabled,
  placeholder,
  actionLabel,
  actionDisabled,
  onAction,
  canWrite,
}: {
  question: Question
  phase: Phase
  sessionId: string
  answer: unknown
  draft: unknown
  onDraftChange: (value: unknown) => void
  disabled: boolean
  placeholder?: string
  actionLabel: string
  actionDisabled: boolean
  onAction: () => void
  canWrite: boolean
}) {
  const timer = useTimer(sessionId, phase)
  const showRing = timer.active && !!phase.timer && phase.timer.visibleTo.includes('player')
  const answered = answer !== undefined && answer !== null
  const current = answered ? answer : draft
  const locked = disabled || answered

  let body: React.ReactNode = null
  if (question.qType === 'single_choice' || question.qType === 'multi_choice') {
    const multi = question.qType === 'multi_choice'
    const picked = multi && Array.isArray(current) ? (current as string[]) : []
    body = (
      <div className="flex flex-col gap-3">
        {question.options.map((opt, i) => {
          const selected = multi ? picked.includes(opt.id) : current === opt.id
          const other = isOtherLabel(opt.label)
          return (
            <LetterOption
              key={opt.id}
              letter={String.fromCharCode(65 + i)}
              label={other ? otherDisplayLabel(opt.label) : opt.label}
              selected={selected}
              disabled={locked}
              onClick={() =>
                onDraftChange(
                  multi
                    ? selected
                      ? picked.filter((p) => p !== opt.id)
                      : [...picked, opt.id]
                    : opt.id
                )
              }
            />
          )
        })}
      </div>
    )
  } else if (question.qType === 'open_text' || question.qType === 'short_answer') {
    body = (
      <textarea
        value={typeof current === 'string' ? current : ''}
        disabled={locked}
        maxLength={question.qType === 'open_text' ? question.maxLen : undefined}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder={placeholder ?? 'Tulis jawabanmu...'}
        className="min-h-48 flex-1 resize-none rounded-lg border bg-[#1C1C1E] p-4 text-sm text-white placeholder:text-white/30 disabled:opacity-60"
        style={{ borderColor: BORDER }}
      />
    )
  }

  return (
    <ScreenFrame
      footer={
        canWrite ? (
          <ActionButton disabled={actionDisabled} onClick={onAction}>
            {actionLabel}
          </ActionButton>
        ) : (
          <p className="text-center text-xs text-white/40">Your team leader controls Next.</p>
        )
      }
    >
      {showRing && phase.timer && (
        <TimerRing
          remainingSec={timer.remainingSec}
          totalSec={phase.timer.seconds}
          expired={timer.expired}
          size={90}
          className="mx-auto"
        />
      )}
      <h2 className="text-xl text-white">{renderPromptBlocks(question.prompt)}</h2>
      {body}
    </ScreenFrame>
  )
}
