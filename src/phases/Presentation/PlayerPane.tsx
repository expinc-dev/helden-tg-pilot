import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { HeldenLogoLotties } from '@/components/HeldenLogoLotties'

export function PresentationPlayerPane() {
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
