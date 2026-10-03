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

            <div className="flex w-[9.57vw] flex-col items-center gap-[0.3vw] rounded-lg bg-white px-[0.34vw] pt-[0.29vw] pb-[0.4vw]">
              <QRCode value={joinUrl} style={{ width: '100%', height: 'auto' }} />
              <p className="text-[0.94vw] leading-[1.2] text-black">scan to play</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
