import { useEffect, useState } from 'react'

import { assets } from '@/assets'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

import { useIsLandscapeAllowed } from '@/lib/orientation'

// Trigger: landscape orientation at ANY viewport width. The app is
// mobile-portrait-first for host/player/join; a landscape browser (dev or real
// device) must always see the rotate overlay. TabletFrame's lg+ desktop
// simulation is superseded by this — devs must narrow the window to portrait
// aspect to test, or opt out via useAllowLandscape() from a specific renderer.
const BAD_QUERY = '(orientation: landscape)'

function useIsBadOrientation(): boolean {
  const [bad, setBad] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(BAD_QUERY).matches : false
  )
  useEffect(() => {
    const mql = window.matchMedia(BAD_QUERY)
    const on = () => setBad(mql.matches)
    on()
    mql.addEventListener('change', on)
    return () => mql.removeEventListener('change', on)
  }, [])
  return bad
}

// Overlay-only guard. Children ALWAYS render underneath, so the page's React
// state, RTDB subscriptions, and in-flight writes are preserved across a
// rotation blip — the overlay is purely a visual gate on top.
export function OrientationGuard({ children }: { children: React.ReactNode }) {
  const bad = useIsBadOrientation()
  const landscapeAllowed = useIsLandscapeAllowed()
  const show = bad && !landscapeAllowed

  return (
    <>
      {children}
      {show && <Overlay />}
    </>
  )
}

function Overlay() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col gap-4 bg-black"
      role="alertdialog"
      aria-live="polite"
      aria-label="Rotate Screen"
    >
      <div
        className="flex flex-1 items-center justify-center gap-6 bg-[#121212]/70 p-6"
        style={{
          backgroundImage: `url(${assets.images.backgrounds.rotate})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <DotLottieReact
          src={assets.lotties.pleaseRotate}
          loop
          autoplay
          className="size-80 flex-shrink-0 -rotate-90"
          aria-hidden
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-bold text-[#FFB800]">Landscape mode is not supported</h1>
          <p className="max-w-3xl text-3xl text-white">
            Devices in landscape mode are not supported. Please rotate your screen to potrait mode
            to continue
          </p>
        </div>
      </div>
    </div>
  )
}
