import { AnswerSavedScreen } from '@/components/AnswerSavedScreen'
import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'
import { Icon } from '@iconify/react'

import { TimerRing } from '../../TimerRing'
import { type ChoiceOption, OPTION_ICONS } from '../../lib'

const TILE_CLASS = [
  'bg-quiz-red-gradient',
  'bg-quiz-blue-gradient',
  'bg-quiz-yellow-gradient',
  'bg-quiz-green-gradient',
]

export function AnsweringStage({
  timer,
  timers,
  submitted,
  selectedId,
  canAnswer,
  options,
  onAnswer,
}: {
  timer: { active: boolean; remainingSec: number; expired: boolean }
  timers: { answering: number }
  step: number
  total: number
  submitted: string | null
  selectedId: string | null
  canAnswer: boolean
  options: ChoiceOption[]
  onAnswer: (optionId: string) => void
}) {
  if (submitted) return <AnswerSavedScreen />

  // A 2-option question (e.g. the AI Myth Quiz's Benar/Salah) would otherwise
  // make both tiles span the whole panel height as a single stretched row;
  // capping that lone row keeps them as tall tiles centred under the ring.
  const singleRow = options.length <= 2

  return (
    <PlayerScreenFrame panelClassName="gap-6 p-4">
      {timer.active && (
        <div className="flex shrink-0 justify-center pt-6">
          <TimerRing
            remainingSec={timer.remainingSec}
            totalSec={timers.answering}
            expired={timer.expired}
            size={90}
          />
        </div>
      )}

      <div
        className={`grid flex-1 grid-cols-2 gap-3 ${singleRow ? 'auto-rows-[70%] content-center' : ''}`}
      >
        {options.map((opt, i) => {
          const isSelected = selectedId === opt.id
          const isDeselected = selectedId !== null && !isSelected
          return (
            <button
              key={opt.id}
              type="button"
              disabled={!canAnswer}
              onClick={() => onAnswer(opt.id)}
              aria-label={opt.label}
              className={`relative flex items-center justify-center rounded-lg text-white shadow-lg transition-all duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed ${TILE_CLASS[i % TILE_CLASS.length]} ${
                isSelected
                  ? 'z-10 scale-[1.03] opacity-100 ring-4 ring-[#FDDB00]'
                  : isDeselected
                    ? 'scale-95 opacity-30'
                    : 'disabled:opacity-40'
              }`}
            >
              <Icon icon={OPTION_ICONS[i % OPTION_ICONS.length]} className="size-12" />
            </button>
          )
        })}
      </div>
    </PlayerScreenFrame>
  )
}
