import { Icon } from '@iconify/react'

export function RevealStage({
  submitted,
  isCorrect,
  myScore,
}: {
  submitted: string | null
  isCorrect: boolean
  myScore: number
}) {
  if (!submitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#121212] p-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/5">
          <Icon icon="mdi:alarm" className="size-14 text-white/50" />
        </div>
        <h2 className="text-2xl font-bold text-white/50">Tidak menjawab</h2>
      </div>
    )
  }

  const accent = isCorrect ? '#34D399' : '#E21B3C'
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-16 p-8"
      style={{
        background: isCorrect
          ? 'radial-gradient(circle at 30% 15%, #1c3b2c, #0f1e16 70%)'
          : 'radial-gradient(circle at 30% 15%, #3a1414, #1c0d0d 70%)',
      }}
    >
      <div
        className="flex size-48 items-center justify-center rounded-full border-4"
        style={{ borderColor: accent, background: `${accent}20` }}
      >
        <Icon
          icon={isCorrect ? 'mdi:check' : 'mdi:close'}
          className="size-32"
          style={{ color: accent }}
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-3xl font-bold" style={{ color: accent }}>
          {isCorrect ? 'Jawaban Benar!' : 'Jawaban Salah!'}
        </h2>
        <p className="text-white/60">{myScore} poin total</p>
      </div>
    </div>
  )
}
