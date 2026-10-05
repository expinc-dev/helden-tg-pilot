import QRCode from 'react-qr-code'

import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { HeldenLogoLotties } from '@/components/HeldenLogoLotties'

import { usePresenceCounts } from '@/lib/sync/useSession'

// Shown on the central screen once presence is confirmed but the host hasn't
// started the session yet — styled per the Helden Inc. lobby design. Players
// scan the QR (join-by-code link, no team) to hop straight into the session.
export function WaitingScreen({ sessionId, joinCode }: { sessionId?: string; joinCode?: string }) {
  const { players } = usePresenceCounts(sessionId)
  const joinUrl = joinCode ? `${window.location.origin}/join/player?code=${joinCode}` : null
  return (
    <div
      className="flex min-h-screen flex-col items-center bg-neutral-950 bg-cover bg-center"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <FullscreenToggle />

      <div className="flex flex-1 items-center justify-center gap-[4.17vw] pb-[5.6vw]">
        <HeldenLogoLotties className="h-auto w-[45.4vw]" />

        {joinUrl && (
          <>
            <div className="h-[8vw] w-px bg-white/30" />

            {/* Figma: white 184×211 card, 171px QR, "scan to play" 18px black. */}
            <div className="flex w-[9.57vw] flex-col items-center gap-[0.3vw] rounded-lg bg-white px-[0.34vw] pt-[0.29vw] pb-[0.4vw]">
              <QRCode value={joinUrl} style={{ width: '100%', height: 'auto' }} />
              <p className="text-[0.94vw] leading-[1.2] text-black">scan to play</p>
            </div>
          </>
        )}
      </div>

      <div className="mb-[8.8vw] flex items-center justify-center bg-black/40 px-[1.25vw] py-[0.52vw]">
        <p className="text-[1.25vw] leading-[1.2] text-white">
          <span className="font-bold text-[#fddb00] underline">{players}</span> Pemain telah
          bergabung...
        </p>
      </div>
    </div>
  )
}
