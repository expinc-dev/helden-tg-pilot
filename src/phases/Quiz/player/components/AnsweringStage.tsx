import { Icon } from '@iconify/react'

import { TimerRing } from '../../TimerRing'
import { type ChoiceOption, OPTION_COLORS, OPTION_ICONS } from '../../lib'

export function AnsweringStage({
  timer,
  timers,
  step,
  total,
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
    <div className="flex min-h-dvh flex-col bg-[#121212]">
      <div className="h-1.5 w-full bg-white/10">
        <div
          className="h-full rounded-r-full bg-[#FFB800] transition-all duration-500"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>

      {timer.active && (
        <div className="flex flex-col items-center px-4 pt-4">
          <TimerRing
            remainingSec={timer.remainingSec}
            totalSec={timers.answering}
            expired={timer.expired}
            size={96}
          />
        </div>
      )}

      {submitted ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#26890C]/20">
            <Icon icon="mdi:check-circle" className="size-10 text-[#26890C]" />
          </div>
          <p className="text-xl font-semibold text-white">Jawaban terkirim!</p>
          <p className="text-white/40">Menunggu jawaban lainnya...</p>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-3 p-4 pb-8">
          {options.map((opt, i) => {
            const color = OPTION_COLORS[i % OPTION_COLORS.length]
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
                className={`relative flex items-center justify-center rounded-xl shadow-lg transition-all duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed ${
                  isSelected
                    ? 'z-10 scale-105 opacity-100 shadow-2xl ring-4 ring-white'
                    : isDeselected
                      ? 'scale-95 opacity-30'
                      : 'disabled:opacity-40'
                }`}
                style={{ background: color.bg, color: color.text }}
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
