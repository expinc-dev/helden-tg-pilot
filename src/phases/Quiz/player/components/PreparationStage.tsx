import { Icon } from '@iconify/react'

export function PreparationStage({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#121212] p-8">
      <Icon icon="mdi:target" className="size-16 text-[#FFB800]" />
      <h2 className="text-3xl font-bold text-[#FFB800]">Bersiap!</h2>
      <p className="text-lg text-white/50">
        Pertanyaan {step + 1} / {total}
      </p>
      <div className="mt-2 h-1 w-32 animate-pulse rounded-full bg-[#FFB800]/30" />
    </div>
  )
}
