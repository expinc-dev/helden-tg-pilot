import QRCode from 'react-qr-code'

import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'

import { usePresenceCounts } from '@/lib/sync/useSession'

// Shown on the central screen once presence is confirmed but the host hasn't
// started the session yet — styled per the Helden Inc. lobby design. Players
// scan the QR (join-by-code link, no team) to hop straight into the session.
export function WaitingScreen({ sessionId, joinCode }: { sessionId?: string; joinCode?: string }) {
  const { players } = usePresenceCounts(sessionId)
  const joinUrl = joinCode ? `${window.location.origin}/join/player?code=${joinCode}` : null
  console.log(joinUrl)
  return (
    <div
      className="flex min-h-screen flex-col items-center bg-neutral-950 bg-cover bg-center p-8"
      style={{ backgroundImage: `url(${assets.images.backgrounds.lobbyBg})` }}
    >
      <FullscreenToggle />

      <div className="flex flex-1 items-center justify-center gap-8">
        <img src={assets.images.logos.companyLogo} alt="Helden Inc." className="h-20 w-auto" />

        {joinUrl && (
          <>
            <div className="h-24 w-px bg-white/15" />

            <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4">
              <QRCode value={joinUrl} size={128} />
              <p className="text-xs text-neutral-500">scan to play</p>
            </div>
          </>
        )}
      </div>

      <div className="mb-10 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80">
        <span className="font-semibold text-yellow-500">{players}</span> Pemain telah bergabung…
      </div>
    </div>
  )
}
