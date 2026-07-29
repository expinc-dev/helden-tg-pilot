import { Icon } from '@iconify/react'

// Depletes counter-clockwise: elapsed sweeps clockwise from 12, so whatever's
// left is always the sliver still sitting on the left/top-left side.
export function TimerRing({
  remainingSec,
  totalSec,
  expired,
  size = 96,
}: {
  remainingSec: number
  totalSec: number
  expired: boolean
  size?: number
}) {
  const isUrgent = remainingSec <= 5
  const ringColor = isUrgent ? '#E21B3C' : '#FFB800'
  const elapsedPct = Math.min(100, Math.max(0, 100 - (remainingSec / totalSec) * 100))
  const thickness = Math.max(5, Math.round(size * 0.075))

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full ${
        isUrgent && !expired ? 'animate-pulse' : ''
      }`}
      style={{
        width: size,
        height: size,
        background: expired
          ? 'rgba(255,255,255,0.08)'
          : `conic-gradient(rgba(255,255,255,0.08) ${elapsedPct}%, ${ringColor} ${elapsedPct}% 100%)`,
        transition: 'background 1s linear',
      }}
    >
      <div className="absolute rounded-full bg-[#121212]" style={{ inset: thickness }} />
      <div className="relative flex items-baseline gap-0.5">
        {expired ? (
          <Icon icon="mdi:alarm" style={{ color: ringColor, fontSize: size * 0.35 }} />
        ) : (
          <>
            <span className="font-bold text-white tabular-nums" style={{ fontSize: size * 0.32 }}>
              {String(remainingSec).padStart(2, '0')}
            </span>
            <span className="font-semibold text-white/50" style={{ fontSize: size * 0.14 }}>
              s
            </span>
          </>
        )}
      </div>
    </div>
  )
}
