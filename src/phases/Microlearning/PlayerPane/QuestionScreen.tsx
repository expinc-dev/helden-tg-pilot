import { assets } from '@/assets'
import { LetterOption } from '@/components/LetterOption'
import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'
import type { Block, MicroStep, Phase, Question } from '@helden-inc/tg-schema'

import { TimerRing } from '@/phases/Quiz/TimerRing'

import {
  renderInline,
  renderNumberedList,
  renderPromptBlocks,
  renderRichText,
} from '@/lib/richText'
import { useTimer } from '@/lib/sync/useTimer'

import { BlockView } from './Blocks'
import { ActionButton } from './shared'
import { isOtherLabel, otherDisplayLabel, plainPrompt, plainText } from './simpleFlow'

const BORDER = '#353535'
// Figma question prompt: Manrope Medium 20 / 1.3, tracking -0.04em, #ccc.
const PROMPT_CLASS = 'text-xl leading-[1.3] font-medium tracking-[-0.04em] text-[#ccc]'
const INPUT_CLASS =
  'w-full rounded-lg border bg-[#1C1C1E] p-4 text-sm text-white placeholder:text-white/30 disabled:opacity-60'

type QuestionBlock = { index: number; question: Question }

const isChoice = (q: Question) => q.qType === 'single_choice' || q.qType === 'multi_choice'

// One step on one screen (design: back icon, timer ring, title + subtitle,
// body, action button below the card). Handles text / heading / button blocks
// and any number of simple questions. Fully controlled — commit and advance
// stay in PlayerPane; answers/drafts are keyed by block index.
export function StepScreen({
  step,
  phase,
  sessionId,
  playerId,
  answers,
  drafts,
  onDraftChange,
  disabled,
  placeholder,
  actionLabel,
  actionDisabled,
  onAction,
  canWrite,
  onBack,
  secondaryAction,
}: {
  step: MicroStep
  phase: Phase
  sessionId: string
  playerId: string
  answers: Record<number, unknown>
  drafts: Record<number, unknown>
  onDraftChange: (index: number, value: unknown) => void
  disabled: boolean
  placeholder?: string
  actionLabel: string
  actionDisabled: boolean
  onAction: () => void
  canWrite: boolean
  onBack?: () => void
  // Optional dark button left of the action (e.g. "Sebelumnya").
  secondaryAction?: { label: string; onClick: () => void }
}) {
  const timer = useTimer(sessionId, phase)
  const showRing = timer.active && !!phase.timer && phase.timer.visibleTo.includes('player')

  const questions: QuestionBlock[] = step.blocks.flatMap((b, index) =>
    b.kind === 'question' ? [{ index, question: b.question }] : []
  )
  const single = questions.length === 1 ? questions[0] : undefined
  const loneChoice = !!single && isChoice(single.question)

  // Intro text that adds nothing is hidden: a lone choice question already reads
  // as its own heading, and text that merely repeats the question is noise.
  const hideText = (md: string) =>
    !!single && (loneChoice || plainText(md).includes(plainPrompt(single.question)))
  const texts = step.blocks.flatMap((b) =>
    b.kind === 'text' && !hideText(b.markdown) ? [b.markdown] : []
  )

  const heading = loneChoice ? undefined : step.title
  const subtitleMd = texts[0]
  const bodyTexts = texts.slice(1)
  // A lone text question under a titled step: its prompt is the subtitle.
  const promptAsSubtitle =
    single && !loneChoice && !subtitleMd && heading
      ? renderPromptBlocks(single.question.prompt)
      : null

  // Opening screen: a step that carries an image is laid out as a hero photo,
  // a gold title and a numbered list (image.title / image.caption), then any
  // further blocks in order — instead of the title/subtitle layout below.
  const hero = step.blocks.find((b): b is Extract<Block, { kind: 'image' }> => b.kind === 'image')
  const introTitle = hero ? (hero.title ?? step.title) : undefined
  const hasButton = step.blocks.some((b) => b.kind === 'button')

  const renderQuestion = ({ index, question }: QuestionBlock) => {
    const answer = answers[index]
    const answered = answer !== undefined && answer !== null
    const current = answered ? answer : drafts[index]
    const locked = disabled || answered

    if (question.qType === 'single_choice' || question.qType === 'multi_choice') {
      const multi = question.qType === 'multi_choice'
      const picked = multi && Array.isArray(current) ? (current as string[]) : []
      return (
        <div key={index} className="flex flex-col gap-4">
          {loneChoice ? (
            <h2 className={PROMPT_CLASS}>{renderPromptBlocks(question.prompt)}</h2>
          ) : (
            <p className={PROMPT_CLASS}>{renderPromptBlocks(question.prompt)}</p>
          )}
          {question.options.map((opt, i) => {
            const selected = multi ? picked.includes(opt.id) : current === opt.id
            return (
              <LetterOption
                key={opt.id}
                letter={String.fromCharCode(65 + i)}
                label={isOtherLabel(opt.label) ? otherDisplayLabel(opt.label) : opt.label}
                selected={selected}
                disabled={locked}
                onClick={() =>
                  onDraftChange(
                    index,
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
    }

    // open_text / short_answer
    const value = typeof current === 'string' ? current : ''
    const maxLength = question.qType === 'open_text' ? question.maxLen : undefined
    if (single) {
      return (
        <textarea
          key={index}
          value={value}
          disabled={locked}
          maxLength={maxLength}
          onChange={(e) => onDraftChange(index, e.target.value)}
          placeholder={placeholder ?? 'Tulis jawabanmu..'}
          className={`min-h-48 flex-1 resize-none ${INPUT_CLASS}`}
          style={{ borderColor: BORDER }}
        />
      )
    }
    return (
      <div
        key={index}
        className="flex flex-col gap-3 rounded-lg border p-4"
        style={{ borderColor: BORDER }}
      >
        <p className="text-white">{renderPromptBlocks(question.prompt)}</p>
        <input
          value={value}
          disabled={locked}
          maxLength={maxLength}
          onChange={(e) => onDraftChange(index, e.target.value)}
          placeholder="Tulis jawabanmu.."
          className={INPUT_CLASS}
          style={{ borderColor: BORDER }}
        />
      </div>
    )
  }

  // Buttons (Buka Gemini / Copy) and questions — shared by both layouts.
  const renderStepBlock = (b: Block, index: number) =>
    b.kind === 'button' ? (
      <BlockView
        key={index}
        block={b}
        answer={null}
        draft={undefined}
        onDraftChange={() => {}}
        disabled={false}
        qId=""
        sessionId={sessionId}
        phase={phase}
        playerId={playerId}
      />
    ) : b.kind === 'question' ? (
      renderQuestion({ index, question: b.question })
    ) : null

  return (
    <PlayerScreenFrame
      onBack={onBack}
      bare={!!hero}
      footer={
        canWrite ? (
          <div className="flex gap-3">
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="flex-1 rounded-lg border py-3.5 text-sm font-semibold text-white"
                style={{ borderColor: BORDER, background: '#1B1B1B' }}
              >
                {secondaryAction.label}
              </button>
            )}
            <div className="flex-1">
              <ActionButton disabled={actionDisabled} onClick={onAction}>
                {actionLabel}
              </ActionButton>
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-white/40">
            Pemimpin tim yang menekan Selanjutnya.
          </p>
        )
      }
    >
      {showRing && phase.timer && (
        <TimerRing
          remainingSec={timer.remainingSec}
          totalSec={phase.timer.seconds}
          expired={timer.expired}
          size={88}
          className="mx-auto"
        />
      )}

      {hero ? (
        step.blocks.map((b, index) => {
          if (b.kind === 'image') {
            return (
              <div key={index} className="flex flex-col gap-8">
                {/* Figma Instruction: bordered #353535 / radius 8 photo box. */}
                <div
                  // Capped so the opening screen (photo + title + a short list +
                  // button) fits a 390×844 phone without scrolling.
                  className="aspect-[4/5] w-full overflow-hidden rounded-lg border bg-[#111]"
                  style={{
                    borderColor: BORDER,
                    // Reserve room for the timer ring and an in-step button
                    // (e.g. "Buka Gemini") so the footer action stays on screen.
                    maxHeight: `max(160px, calc(100dvh - ${444 + (showRing ? 112 : 0) + (hasButton ? 88 : 0)}px))`,
                  }}
                >
                  {/* An empty slot (no upload yet) falls back to the Figma
                      Instruction photo so the opening screen is never blank. */}
                  <img
                    src={b.url || assets.images.presentation.instructionPhoto}
                    alt={b.caption ?? b.title ?? ''}
                    className="size-full object-cover"
                  />
                </div>
                {introTitle && b === hero && (
                  <p
                    className="bg-clip-text text-center text-xl leading-[1.2] font-semibold tracking-[-0.04em] text-transparent"
                    style={{
                      backgroundImage:
                        'linear-gradient(173deg, rgb(253, 219, 0) 14.619%, rgb(253, 164, 0) 68.407%)',
                    }}
                  >
                    {renderInline(introTitle)}
                  </p>
                )}
                {b.caption &&
                  renderNumberedList(b.caption, {
                    itemTextClassName:
                      'text-base leading-[1.2] font-medium tracking-[-0.04em] text-[#ccc]',
                    badgeClassName: 'size-[22px] text-[10px]',
                    listClassName: 'flex flex-col gap-4',
                  })}
              </div>
            )
          }
          if (b.kind === 'text') {
            return (
              <div key={index} className="flex flex-col gap-2 px-3">
                {renderRichText(b.markdown, {
                  paragraphClassName: 'text-base leading-relaxed text-white/85',
                  listClassName: 'list-disc space-y-1 pl-5 text-base text-white/85',
                })}
              </div>
            )
          }
          return renderStepBlock(b, index)
        })
      ) : (
        <>
          {(heading || subtitleMd || promptAsSubtitle) && (
            <div className="flex flex-col items-center gap-1 text-center">
              {heading && <h2 className="text-xl font-bold text-white">{heading}</h2>}
              {subtitleMd &&
                renderRichText(subtitleMd, {
                  paragraphClassName: 'text-base leading-relaxed text-white/80',
                  listClassName: 'list-disc space-y-1 pl-5 text-left text-base text-white/80',
                })}
              {promptAsSubtitle && <p className="text-base text-white/80">{promptAsSubtitle}</p>}
            </div>
          )}

          {bodyTexts.map((md, i) => (
            <div key={i} className="flex flex-col gap-2">
              {renderRichText(md, {
                paragraphClassName: 'text-sm leading-relaxed text-white/70',
                listClassName: 'list-disc space-y-1 pl-5 text-sm text-white/70',
              })}
            </div>
          ))}

          {step.blocks.map((b, index) => renderStepBlock(b, index))}
        </>
      )}
    </PlayerScreenFrame>
  )
}
