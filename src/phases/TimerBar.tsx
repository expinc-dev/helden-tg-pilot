import type { Phase } from '@helden-inc/tg-schema'

import { useTimer } from '@/lib/sync/useTimer'

import type { Role } from './PhaseRouter'

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

// Server-authoritative countdown display. Host always sees it; player/central only
// if listed in timer.visibleTo. Renders nothing when the phase has no active timer.
export function TimerBar({
  sessionId,
  phase,
  role,
}: {
  sessionId: string
  phase: Phase
  role: Role
}) {
  const timer = useTimer(sessionId, phase)
  if (!timer.active) return null

  const visible =
    role === 'host' || (phase.timer?.visibleTo ?? []).includes(role as 'player' | 'central')
  if (!visible) return null

  return (
    <div className="flex items-center justify-center">
      {timer.expired ? (
        <span className="rounded-full bg-[#E21B3C]/10 px-3 py-1 text-sm font-semibold text-[#E21B3C]">
          Time’s up
        </span>
      ) : (
        <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-lg text-[#FFB800] tabular-nums">
          {mmss(timer.remainingSec)}
        </span>
      )}
    </div>
  )
}
