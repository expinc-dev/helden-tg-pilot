import { Icon } from '@iconify/react'

import { useFullscreen } from '@/lib/useFullscreen'

// `position="fixed"` (default) pins to the real viewport — for full-bleed,
// never-tablet-framed pages (central). `position="absolute"` pins to the
// nearest positioned ancestor instead — for pages rendered inside
// TabletFrame, where `fixed` would escape the simulated phone frame on
// desktop and stick to the real browser window corner.
export function FullscreenToggle({ position = 'fixed' }: { position?: 'fixed' | 'absolute' }) {
  const { isFullscreen, toggle } = useFullscreen()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle fullscreen"
      className={`${position} top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10`}
    >
      <Icon
        icon={isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'}
        className="size-5 text-yellow-300"
      />
    </button>
  )
}
