import { Icon } from '@iconify/react'

import { mmss } from '@/lib/sync/timermath'

import { type ChoiceOption, OPTION_COLORS, OPTION_ICONS } from '../../lib'

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
  submitted: string | null
  selectedId: string | null
  canAnswer: boolean
  options: ChoiceOption[]
  onAnswer: (optionId: string) => void
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#121212]">
      {timer.active && (
        <div className="flex flex-col items-center gap-1 px-4 pt-4">
          <span
            className="flex items-center text-4xl font-bold tabular-nums"
            style={{ color: timer.remainingSec <= 5 ? '#E21B3C' : '#FFB800' }}
          >
            {timer.expired ? (
              <Icon icon="mdi:alarm" className="size-9" />
            ) : (
              mmss(timer.remainingSec)
            )}
          </span>
          {!timer.expired && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#FFB800] transition-all duration-1000 ease-linear"
                style={{
                  width: `${Math.max(0, (timer.remainingSec / timers.answering) * 100)}%`,
                }}
              />
            </div>
          )}
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
