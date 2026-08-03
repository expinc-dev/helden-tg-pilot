import { assets } from '@/assets'
import { Icon } from '@iconify/react'

import { TimerRing } from '../../TimerRing'
import { type ChoiceOption, OPTION_ICONS } from '../../lib'

export function AnsweringStage({
  timer,
  timers,
  // step,
  // total,
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
  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* <div className="h-1.5 w-full bg-white/10">
        <div
          className="h-full rounded-r-full bg-[#FFB800] transition-all duration-500"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div> */}

      {timer.active && (
        <div className="flex flex-col items-center px-4 py-12">
          <TimerRing
            remainingSec={timer.remainingSec}
            totalSec={timers.answering}
            expired={timer.expired}
            size={120}
          />
        </div>
      )}

      {submitted ? (
        <div className="-mt-10 flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-4xl font-semibold text-white">Jawaban tersimpan!</p>
          <p className="text-xl text-white/90">Menunggu pemain lain menjawab...</p>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-3 p-4 px-10 pb-8">
          {options.map((opt, i) => {
            const icon = OPTION_ICONS[i % OPTION_ICONS.length]
            const isSelected = selectedId === opt.id
            const isDeselected = selectedId !== null && !isSelected
            return (
              <button
                key={opt.id}
                type="button"
                disabled={!canAnswer}
                onClick={() => onAnswer(opt.id)}
                aria-label={opt.label}
                className={`relative flex items-center justify-center rounded-xl text-white shadow-lg transition-all duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed ${i === 0 ? 'bg-quiz-red-gradient' : i === 1 ? 'bg-quiz-blue-gradient' : i === 2 ? 'bg-quiz-yellow-gradient' : 'bg-quiz-green-gradient'} ${
                  isSelected
                    ? 'z-10 scale-105 opacity-100 shadow-2xl ring-4 ring-white'
                    : isDeselected
                      ? 'scale-95 opacity-30'
                      : 'disabled:opacity-40'
                }`}
              >
                {isSelected && (
                  <span className="absolute inset-0 animate-ping rounded-xl ring-4 ring-white" />
                )}
                <Icon icon={icon} className="size-16" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
