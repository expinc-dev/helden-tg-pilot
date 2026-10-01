import { Icon } from '@iconify/react'

// Player-side "answer saved" wait screen — one shared look for every phase that
// seals an answer: deep green gradient (dark enough for the green title and white text to stay legible), check inside a ring, everything centred.
export function AnswerSavedScreen({
  title = 'Jawaban Tersimpan!',
  subtitle = 'Menunggu pemain lainnya...',
  className = '',
}: {
  title?: string
  subtitle?: string
  className?: string
}) {
  return (
    <div
      className={`flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-8 text-center ${className}`}
      style={{
        background:
          'radial-gradient(120% 70% at 25% 8%, #3F7C5A 0%, rgba(63, 124, 90, 0) 60%), linear-gradient(165deg, #2A4D3A 0%, #1F382B 50%, #16261D 100%)',
      }}
    >
      <div
        className="mb-2 flex size-28 items-center justify-center rounded-full border-[6px] bg-white/10"
        style={{ borderColor: '#4FD18B' }}
      >
        <Icon icon="mdi:check" className="size-16" style={{ color: '#4FD18B' }} />
      </div>
      <p className="text-xl font-bold" style={{ color: '#4FD18B' }}>
        {title}
      </p>
      <p className="text-base text-white">{subtitle}</p>
    </div>
  )
}
