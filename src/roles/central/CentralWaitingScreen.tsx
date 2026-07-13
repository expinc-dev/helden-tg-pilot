import { assets } from '@/assets'

import { FullscreenToggle } from './FullscreenToggle'

// Shown on the central screen once presence is confirmed but the host hasn't
// started the session yet — styled per the Helden Inc. lobby design.
export function CentralWaitingScreen() {
  return (
    <div
      className="flex min-h-screen flex-col items-center bg-neutral-950 bg-cover bg-center p-8"
      style={{ backgroundImage: `url(${assets.images.backgrounds.lobbyBg})` }}
    >
      <FullscreenToggle />

      <div className="mt-12 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80">
        <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.5)]" />
        Central Screen
      </div>

      <div className="flex flex-1 items-center justify-center">
        <img src={assets.images.logos.companyLogo} alt="Helden Inc." className="h-20 w-auto" />
      </div>

      <p className="pb-10 text-sm text-yellow-500">Hackathon Malang 2026</p>
    </div>
  )
}
