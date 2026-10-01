import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'

import { TimerRing } from '@/phases/Quiz/TimerRing'

import { useTimer } from '@/lib/sync/useTimer'

import type { SortOrderConfig } from '../score'

// Central stays idle for sort_order: the correct order and every player's
// answer are deliberately NOT projected on the wall (the host runs the debrief
// from the host screen). Only the shared clock is shown.
export function CentralSortOrder({
  sessionId,
  phase,
}: {
  sessionId: string
  phase: Phase
  config?: SortOrderConfig
}) {
  const timer = useTimer(sessionId, phase)
  const totalSec = phase.timer?.seconds ?? 60

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 p-12"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {timer.active && (
        <TimerRing
          remainingSec={timer.remainingSec}
          totalSec={totalSec}
          expired={timer.expired}
          size={160}
        />
      )}
      <p className="text-2xl text-white/70">Kerjakan di perangkatmu</p>
    </div>
  )
}
