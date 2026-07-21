import { assets } from '@/assets'
import { Icon } from '@iconify/react'

import type { ReflectionContent } from '../lib'
import { useReflectionStats } from '../lib'

// Big-screen view — same full-bleed background + centered layout as
// CentralQuiz, so a reflection phase doesn't look like a different app on the
// main screen. Nameless (public display): answered count only — the scale
// average and per-player list stay on the host's device.
export function CentralReflection({
  content,
  sessionId,
  phaseId,
}: {
  content: ReflectionContent
  sessionId: string
  phaseId: string
}) {
  const { rows, answered } = useReflectionStats(sessionId, phaseId)

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex items-center gap-3 rounded-full bg-white/10 px-6 py-2 text-xl text-white/80">
        <Icon icon="mdi:comment-quote-outline" className="size-6 text-[#FFB800]" />
        <span className="font-bold text-[#FFB800]">{answered.length}</span>
        <span>/</span>
        <span>{rows.length}</span>
        <span className="text-white/50">menjawab</span>
      </div>

      <h1 className="max-w-4xl text-center text-4xl leading-tight font-bold text-white drop-shadow-lg">
        {content.prompt}
      </h1>
    </div>
  )
}
