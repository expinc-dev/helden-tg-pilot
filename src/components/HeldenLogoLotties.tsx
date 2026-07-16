import { assets } from '@/assets'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

export function HeldenLogoLotties({ className }: { className?: string }) {
  return (
    <DotLottieReact
      src={assets.lotties.heldenLogo}
      loop
      autoplay
      className={className}
      aria-label="Helden Inc."
    />
  )
}
