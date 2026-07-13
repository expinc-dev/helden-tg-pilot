import { useState } from 'react'

import { assets } from '@/assets'

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    } else {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle fullscreen"
      className="fixed top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
    >
      <img
        src={
          isFullscreen ? assets.images.icons.notFullscreenIcon : assets.images.icons.fullscreenIcon
        }
        alt=""
        className="h-4 w-4"
      />
    </button>
  )
}
