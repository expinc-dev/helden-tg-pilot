import { useState } from 'react'

import { AnswerSavedScreen } from '@/components/AnswerSavedScreen'
import { LetterOption } from '@/components/LetterOption'
import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'

import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'

import { renderPromptBlocks } from '@/lib/richText'

import type { ScaleQuestion } from '../../scale'

// HLN-012. A scale statement is private and ungraded: the player taps one point
// and the answer is sealed immediately — no reveal, no right/wrong, no score,
// no leaderboard. The only post-submit state is the same neutral
// "Jawaban tersimpan!" wait the choice questions use, so nothing on this screen
// can hint at what anyone else answered.
//
// The statement sits here, on the player's own device, because that is what
// `on_device` means — the player reads and answers without looking up at the
// central screen. The host also shows it so the facilitator can read it aloud.
//
// Deliberately no TimerRing even when a phase carries a server timer: an
// attitude statement is not a race, and control.ts disarms the timer node for
// on_device entirely.
export function ScaleStage({
  question,
  points,
  submitted,
  canAnswer,
  onAnswer,
}: {
  question: ScaleQuestion
  points: number[]
  submitted: string | number | null
  selectedValue: number | null
  canAnswer: boolean
  onAnswer: (value: number) => void
}) {
  const [minLabel, maxLabel] = question.labels ?? []
  const [picked, setPicked] = useState<number | null>(null)

  if (submitted !== null) return <AnswerSavedScreen />

  // Figma Question-5: lettered rows, A = the strongest agreement. Only the two
  // ends carry authored labels; the points between show their number.
  const ordered = [...points].reverse()
  const labelFor = (value: number) =>
    value === points[points.length - 1] && maxLabel
      ? maxLabel
      : value === points[0] && minLabel
        ? minLabel
        : `Poin ${value}`

  return (
    <PlayerScreenFrame
      footer={
        <ActionButton
          disabled={picked === null || !canAnswer}
          onClick={() => picked !== null && onAnswer(picked)}
        >
          Kumpulkan
        </ActionButton>
      }
    >
      <h2 className="text-xl leading-[1.3] font-medium tracking-[-0.04em] text-[#ccc]">
        {renderPromptBlocks(question.prompt)}
      </h2>
      <div className="flex flex-col gap-3">
        {ordered.map((value, i) => (
          <LetterOption
            key={value}
            letter={String.fromCharCode(65 + i)}
            label={labelFor(value)}
            selected={picked === value}
            disabled={!canAnswer}
            onClick={() => setPicked(value)}
          />
        ))}
      </div>
    </PlayerScreenFrame>
  )
}
