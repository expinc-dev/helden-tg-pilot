import { Icon } from '@iconify/react'

import { OPTION_COLORS, OPTION_ICONS, useDistribution } from '../../lib'

export function DistributionBars({
  sessionId,
  phaseId,
  questionIndex,
  options,
  showCorrect,
  correctId,
}: {
  sessionId: string
  phaseId: string
  questionIndex: number
  options: { id: string; label: string }[]
  showCorrect: boolean
  correctId?: string
}) {
  const dist = useDistribution(sessionId, `${phaseId}_q${questionIndex}`)
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt, i) => {
        const count = dist[opt.id] ?? 0
        const pct = Math.round((count / total) * 100)
        const color = OPTION_COLORS[i % OPTION_COLORS.length]
        const icon = OPTION_ICONS[i % OPTION_ICONS.length]
        const isCorrect = showCorrect && correctId === opt.id

        return (
          <div key={opt.id} className="flex items-center gap-3">
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span
                  className={`flex items-center gap-1.5 ${isCorrect ? 'font-bold text-green-400' : 'text-white/80'}`}
                >
                  <Icon icon={icon} className="size-4 shrink-0" />
                  {opt.label} {isCorrect && <Icon icon="mdi:check-circle" className="size-4" />}
                </span>
                <span className="font-mono text-white/50">{count}</span>
              </div>
              <div className="h-7 w-full overflow-hidden rounded-lg bg-white/10">
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: color.bg,
                    opacity: showCorrect && !isCorrect ? 0.3 : 1,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
