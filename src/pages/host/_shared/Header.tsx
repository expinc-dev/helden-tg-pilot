import { assets } from '@/assets'
import { Icon } from '@iconify/react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

import { useFullscreen } from '@/lib/useFullscreen'

interface HeaderProps {
  isShowLogo?: boolean
}

export const Header = ({ isShowLogo = false }: HeaderProps) => {
  const { isFullscreen, toggle } = useFullscreen()
  return (
    <header
      className={`flex items-center ${isShowLogo ? 'justify-between' : 'justify-end'} w-full`}
    >
      {isShowLogo && (
        <DotLottieReact src={assets.lotties.heldenLogo} autoplay loop className="h-20 w-auto" />
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/30 text-yellow-300"
      >
        <Icon icon={isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'} className="size-8" />
      </button>
    </header>
  )
}
