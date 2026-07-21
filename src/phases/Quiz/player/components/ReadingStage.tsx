import { Icon } from '@iconify/react'

import { mmss } from '@/lib/sync/timermath'

export function ReadingStage({ timer }: { timer: { active: boolean; remainingSec: number } }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#121212] p-8">
      <Icon icon="mdi:television" className="size-12 text-white" />
      <h2 className="text-2xl font-bold text-white">Perhatikan Layar Utama</h2>
      <p className="text-white/40">Pertanyaan sedang ditampilkan...</p>
      {timer.active && (
        <div
          className="mt-2 text-4xl font-bold tabular-nums"
          style={{ color: timer.remainingSec <= 3 ? '#E21B3C' : '#FFB800' }}
        >
          {mmss(timer.remainingSec)}
        </div>
      )}
    </div>
  )
}
