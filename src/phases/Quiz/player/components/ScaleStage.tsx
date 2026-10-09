import { useState } from 'react'

import { AnswerSavedScreen } from '@/components/AnswerSavedScreen'
import { LetterOption } from '@/components/LetterOption'
import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'

import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'

import { renderPromptBlocks } from '@/lib/richText'

import { TimerRing } from '../../TimerRing'
import { type ScaleQuestion, scaleLabels } from '../../scale'

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
// A TimerRing shows only when the author set an answering limit (the host then
// arms the timer per statement). It is not a race by default: with no limit
// there is no timer node and no ring.
export function ScaleStage({
  question,
  points,
  submitted,
  canAnswer,
  onAnswer,
  timer,
  totalSec,
}: {
  question: ScaleQuestion
  points: number[]
  submitted: string | number | null
  selectedValue: number | null
  canAnswer: boolean
  onAnswer: (value: number) => void
  timer?: { active: boolean; remainingSec: number; expired: boolean }
  // The authored per-statement limit, used as the ring's full scale.
  totalSec?: number
}) {
  const [picked, setPicked] = useState<number | null>(null)

  if (submitted !== null) return <AnswerSavedScreen />

  // Figma Question-5: lettered rows, A = the strongest agreement.
  const ordered = [...points].reverse()
  const labels = scaleLabels(points, question.labels)
  const labelFor = (value: number) => labels[points.indexOf(value)]

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
      {timer?.active && totalSec !== undefined && (
        <div className="flex shrink-0 justify-center">
          <TimerRing
            remainingSec={timer.remainingSec}
            totalSec={totalSec}
            expired={timer.expired}
            size={88}
          />
        </div>
      )}
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
