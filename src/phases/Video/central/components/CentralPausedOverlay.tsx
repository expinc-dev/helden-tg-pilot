import { Icon } from '@iconify/react'

export function CentralPausedOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/70 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-black/80 ring-1 ring-white/10">
        <Icon icon="mdi:pause" className="size-10 text-[#FFB800]" />
      </div>
      <h2 className="text-2xl font-bold text-[#FFB800] sm:text-3xl">Video dijeda</h2>
      <p className="text-sm text-white/80 sm:text-base">Menunggu instruksi dari host</p>
    </div>
  )
}
