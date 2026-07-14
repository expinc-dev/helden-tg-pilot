import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { HeldenLogoLotties } from '@/components/HeldenLogoLotties'

// Shown once a player has successfully joined (and, in team mode, picked a
// team) but the host hasn't started the session yet. The team pill only
// renders when this session actually has team mode on and a team assigned —
// solo sessions never show team text here.
export function PlayerWaitingScreen({ teamName }: { teamName?: string }) {
  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center bg-neutral-950 bg-cover bg-center p-6"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <FullscreenToggle position="absolute" />

      <HeldenLogoLotties className="h-6 w-auto" />

      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p
          className="text-xl font-bold text-yellow-400"
          style={{ textShadow: '0 0 16px rgba(250, 204, 21, 0.6)' }}
        >
          Berhasil Masuk!
        </p>
        <p
          className="text-xl font-bold text-white"
          style={{ textShadow: '0 0 16px rgba(255, 255, 255, 0.5)' }}
        >
          Menunggu Permainan Dimulai...
        </p>
      </div>

      {teamName && (
        <div className="mb-10 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80">
          Tim {teamName}
        </div>
      )}
    </div>
  )
}
