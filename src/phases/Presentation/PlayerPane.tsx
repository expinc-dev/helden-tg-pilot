import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { HeldenLogoLotties } from '@/components/HeldenLogoLotties'
import type { PresentationContent } from '@helden-inc/tg-schema'

import { useCentralStep } from '@/lib/sync/useCentralStep'

// Presentation is host-paced and watch-only: the player mirrors whatever the
// host/central screen is showing, slide indicator included. There is no
// per-player interaction on this phase — former question blocks were removed
// from presentations at the schema/CMS level, so the old submit flow is gone.
export function PresentationPlayerPane({
  content,
  sessionId,
}: {
  content: PresentationContent
  sessionId: string
}) {
  const [step] = useCentralStep(sessionId)
  const bounded = Math.min(Math.max(step, 0), content.slides.length - 1)

  return (
    <div
      className="absolute inset-0 flex flex-col items-center bg-neutral-950 bg-center p-6"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <span
        className="fixed top-4 right-4 z-10 rounded-md border px-3 py-1 text-xs text-white/70"
        style={{ borderColor: '#353535', background: 'rgba(8,8,8,0.5)' }}
      >
        {bounded + 1} / {content.slides.length}
      </span>
      <FullscreenToggle position="absolute" />
      <HeldenLogoLotties className="h-6 w-auto self-start" />

      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p
          className="text-xl font-bold text-white"
          style={{ textShadow: '0 0 16px rgba(255, 255, 255, 0.5)' }}
        >
          Lihat layar utama
        </p>
        <p className="text-sm text-white/60">Perhatikan presentasi di layar utama.</p>
      </div>
    </div>
  )
}
