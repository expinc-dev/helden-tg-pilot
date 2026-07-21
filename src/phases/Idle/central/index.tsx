import QRCode from 'react-qr-code'

import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { HeldenLogoLotties } from '@/components/HeldenLogoLotties'

import { useSessionConfig } from '@/lib/sync/useSession'

// Same lobby look as WaitingScreen (logo + QR to join), minus the "N Pemain
// telah bergabung" bar — mid-session idle isn't the join window anymore.
export function CentralIdleScreen({ sessionId }: { sessionId: string }) {
  const config = useSessionConfig(sessionId)
  const joinUrl = config?.joinCode
    ? `${window.location.origin}/join/player?code=${config.joinCode}`
    : null

  return (
    <div
      className="flex min-h-screen flex-col items-center bg-neutral-950 bg-cover bg-center p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <FullscreenToggle />

      <div className="flex flex-1 items-center justify-center gap-10">
        <HeldenLogoLotties className="h-52 w-auto" />

        {joinUrl && (
          <>
            <div className="h-40 w-px bg-white/30" />

            <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4">
              <QRCode value={joinUrl} size={128} />
              <p className="text-xs text-neutral-500">scan to play</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
