import { assets } from '@/assets'
import LottieImport from 'lottie-react'

// Vite's CJS/UMD interop for lottie-react sometimes resolves the default
// import to the whole module-exports object instead of the component itself
// — unwrap defensively rather than depend on a particular bundler quirk.
const Lottie =
  (LottieImport as unknown as { default?: typeof LottieImport }).default ?? LottieImport

export function HeldenLogoLotties({ className }: { className?: string }) {
  return (
    <Lottie
      animationData={assets.lotties.heldenLogo}
      loop
      className={className}
      aria-label="Helden Inc."
    />
  )
}
