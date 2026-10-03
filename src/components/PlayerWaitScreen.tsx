import { assets } from '@/assets'

import { PlayerAppBar } from './PlayerAppBar'

// Player "wait" state (Figma Idle / Idle-4): app bar, one centred gold-gradient
// line ("Menunggu Dimulai.." / "Lihat Layar Utama!"). The optional team pill
// is kept below it for team sessions.
export function PlayerWaitScreen({ message, teamName }: { message: string; teamName?: string }) {
  return (
    <div
      className="relative flex min-h-dvh w-full flex-col bg-[#1E1E1E] bg-cover bg-center"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <PlayerAppBar />
      <div className="flex flex-1 items-center justify-center px-6">
        {/* Figma: Manrope Bold 24 / 1.2, tracking -0.04em, capitalised. A gold
            gradient line with a soft glow sits over a blurred white copy. */}
        <div className="relative text-center text-2xl leading-[1.2] font-bold tracking-[-0.04em] whitespace-nowrap capitalize">
          <span
            aria-hidden="true"
            className="absolute inset-0 text-white opacity-[0.24] blur-[32px]"
          >
            {message}
          </span>
          <h1
            className="relative bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(167deg, rgb(253, 219, 0) 14.619%, rgb(253, 164, 0) 68.407%)',
              textShadow: '0 0 12px rgba(253, 164, 0, 0.2)',
            }}
          >
            {message}
          </h1>
        </div>
      </div>
      {teamName && (
        <div className="mx-auto mb-10 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80">
          Tim {teamName}
        </div>
      )}
    </div>
  )
}
