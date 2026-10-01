import { Icon } from '@iconify/react'

import { useFullscreen } from '@/lib/useFullscreen'

// The one fullscreen button. Host Header and FullscreenToggle both render this,
// so there is a single look and a single implementation.
export function FullscreenButton({
  className = '',
  iconClassName = 'size-5 text-yellow-300',
}: {
  className?: string
  iconClassName?: string
}) {
  const { isFullscreen, toggle } = useFullscreen()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      className={`flex cursor-pointer items-center justify-center rounded-full ${className}`}
    >
      <Icon
        icon={isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'}
        className={iconClassName}
      />
    </button>
  )
}

// `position="fixed"` (default) pins to the real viewport — for full-bleed,
// never-tablet-framed pages (central). `position="absolute"` pins to the
// nearest positioned ancestor instead — for pages rendered inside
// TabletFrame, where `fixed` would escape the simulated phone frame on
// desktop and stick to the real browser window corner.
export function FullscreenToggle({ position = 'fixed' }: { position?: 'fixed' | 'absolute' }) {
  return (
    <FullscreenButton
      className={`${position} top-6 right-6 h-8 w-8 border border-white/10 bg-white/5 hover:bg-white/10`}
    />
  )
}
