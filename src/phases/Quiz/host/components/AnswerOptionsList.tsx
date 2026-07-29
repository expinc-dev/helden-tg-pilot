import { Icon } from '@iconify/react'

import { type ChoiceOption, useDistribution } from '../../lib'

// Host-only option list: lettered badges, no color/shape icons (those are
// player/central-facing). Pre-reveal it's just badge + label (no live
// distribution, so the host can't spoil results by reading the screen).
// Post-reveal each row grows a proportional bar + count + correct/wrong icon.
export function AnswerOptionsList({
  sessionId,
  phaseId,
  questionIndex,
  options,
  revealed,
  correctId,
}: {
  sessionId: string
  phaseId: string
  questionIndex: number
  options: ChoiceOption[]
  revealed: boolean
  correctId?: string
}) {
  const dist = useDistribution(sessionId, `${phaseId}_q${questionIndex}`)
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="flex w-full flex-col gap-2.5">
      {options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i)
        const count = dist[opt.id] ?? 0
        const pct = Math.round((count / total) * 100)
        const isCorrect = revealed && correctId === opt.id

        return (
          <div
            key={opt.id}
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
            style={{
              borderColor: isCorrect ? '#26890C' : '#2a2a2a',
              background: isCorrect ? '#26890C1a' : 'transparent',
            }}
          >
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
              style={{
                borderColor: isCorrect ? '#26890C' : '#4a4a4a',
                background: isCorrect ? '#26890C' : 'transparent',
                color: isCorrect ? '#fff' : '#9a9a9a',
              }}
            >
              {letter}
            </div>
            <span className="flex-1 text-sm text-white/80">{opt.label}</span>
            {revealed && (
              <>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: isCorrect ? '#26890C' : '#5a5a5a' }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-sm text-white/60">{count}</span>
                <Icon
                  icon={isCorrect ? 'mdi:check-circle' : 'mdi:close-circle'}
                  className="size-5 shrink-0"
                  style={{ color: isCorrect ? '#26890C' : '#E21B3C' }}
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
