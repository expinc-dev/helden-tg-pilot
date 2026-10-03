import { Icon } from '@iconify/react'

// Player-side "answer saved" / reveal-result wait screen — one shared look for every phase that
// seals an answer: deep green gradient (dark enough for the green title and white text to stay legible), check inside a ring, everything centred.
type Tone = 'success' | 'error' | 'neutral'

const TONES: Record<Tone, { bg: string; accent: string; icon: string }> = {
  success: {
    bg: 'radial-gradient(120% 70% at 25% 8%, #3F7C5A 0%, rgba(63, 124, 90, 0) 60%), linear-gradient(165deg, #2A4D3A 0%, #1F382B 50%, #16261D 100%)',
    accent: '#51CE92',
    icon: 'mdi:check',
  },
  error: {
    bg: 'radial-gradient(120% 70% at 25% 8%, #7C3F3F 0%, rgba(124, 63, 63, 0) 60%), linear-gradient(165deg, #4D2A2A 0%, #381F1F 50%, #261616 100%)',
    accent: '#F26B6B',
    icon: 'mdi:close',
  },
  neutral: {
    bg: 'linear-gradient(165deg, #2A2A2A 0%, #1B1B1B 50%, #121212 100%)',
    accent: '#B8B8B8',
    icon: 'mdi:clock-outline',
  },
}

export function AnswerSavedScreen({
  title = 'Jawaban Tersimpan!',
  subtitle = 'Menunggu pemain lainnya...',
  tone = 'success',
  className = '',
}: {
  title?: string
  subtitle?: string
  tone?: Tone
  className?: string
}) {
  const t = TONES[tone]
  return (
    <div
      className={`flex min-h-dvh w-full flex-col items-center justify-center gap-5 px-8 text-center ${className}`}
      style={{ background: t.bg }}
    >
      <div
        className="flex size-[140px] items-center justify-center rounded-full border-[6px] bg-white/10"
        style={{ borderColor: t.accent }}
      >
        <Icon icon={t.icon} className="size-[77px]" style={{ color: t.accent }} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-2xl leading-[1.2] font-bold" style={{ color: t.accent }}>
          {title}
        </p>
        <p className="text-lg leading-[1.2] font-light text-white">{subtitle}</p>
      </div>
    </div>
  )
}
