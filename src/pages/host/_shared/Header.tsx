import { assets } from '@/assets'
import { Icon } from '@iconify/react'

import { useFullscreen } from '@/lib/useFullscreen'

export const Header = () => {
  const { isFullscreen, toggle } = useFullscreen()
  return (
    <header className="to 70% mb-8 flex items-center justify-between">
      <span className="text-xl font-bold text-[#FFB800] sm:text-2xl">
        <img src={assets.images.logos.helden.sm} alt="Helden Inc." className="h-5" />
      </span>
      <button
        type="button"
        onClick={toggle}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/30 text-yellow-300"
      >
        <Icon icon={isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'} className="size-5" />
      </button>
    </header>
  )
}
