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
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#121212] p-8">
      {submitted ? (
        <>
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full"
            style={{ background: isCorrect ? '#26890C20' : '#E21B3C20' }}
          >
            <span className="text-6xl">{isCorrect ? '🎉' : '😢'}</span>
          </div>
          <h2 className="text-3xl font-bold" style={{ color: isCorrect ? '#26890C' : '#E21B3C' }}>
            {isCorrect ? 'Benar!' : 'Salah!'}
          </h2>
          <div className="flex flex-col items-center gap-1">
            <p className="text-5xl font-bold text-[#FFB800]">{myScore}</p>
            <p className="text-sm text-white/40">poin total</p>
          </div>
        </>
      ) : (
        <>
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/5">
            <Icon icon="mdi:alarm" className="size-14 text-white/50" />
          </div>
          <h2 className="text-2xl font-bold text-white/50">Tidak menjawab</h2>
        </>
      )}
    </div>
  )
}
