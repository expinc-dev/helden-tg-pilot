import { assets } from '@/assets'
import { FullscreenButton } from '@/components/FullscreenToggle'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface HeaderProps {
  isShowLogo?: boolean
}

export const Header = ({ isShowLogo = false }: HeaderProps) => {
  return (
    <header
      className={`flex items-center ${isShowLogo ? 'justify-between' : 'justify-end'} w-full`}
    >
      {isShowLogo && (
        <DotLottieReact src={assets.lotties.heldenLogo} autoplay loop className="h-20 w-auto" />
      )}
      <FullscreenButton className="size-10 bg-black/30" iconClassName="size-8 text-yellow-300" />
    </header>
  )
}
