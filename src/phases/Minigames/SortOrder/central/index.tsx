import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'

import { useTimer } from '@/lib/sync/useTimer'

import type { SortOrderConfig } from '../score'

// Central stays idle for sort_order: the correct order and every player's
// answer are deliberately NOT projected on the wall (the host runs the debrief
// from the host screen). Only the shared clock is shown.
const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

export function CentralSortOrder({
  sessionId,
  phase,
}: {
  sessionId: string
  phase: Phase
  config?: SortOrderConfig
}) {
  const timer = useTimer(sessionId, phase)

  // Figma "Central Idle Animation": a dimmed photo with the countdown huge in
  // the middle (the wall waits while the room works on their own devices).
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${assets.images.backgrounds.central})` }}
    >
      <div className="absolute inset-[1.04vw] overflow-hidden rounded-[0.2vw] border border-[#353535]">
        <img
          src={assets.images.presentation.classroomExample}
          alt=""
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(8,14,30,0.62)]" />
      </div>
      <div className="relative flex flex-col items-center gap-[1.5vw]">
        {timer.active ? (
          <p className="text-[14vw] leading-none font-bold tracking-[-0.02em] text-[#fddb00] tabular-nums">
            {timer.expired ? '00:00' : mmss(timer.remainingSec)}
          </p>
        ) : (
          <p className="text-[2.2vw] text-white/80">Kerjakan di perangkatmu</p>
        )}
      </div>
    </div>
  )
}
