import { Icon } from '@iconify/react'

import { useFullscreen } from '@/lib/useFullscreen'

export function FullscreenToggle() {
  const { isFullscreen, toggle } = useFullscreen()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle fullscreen"
      className="fixed top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
    >
      <Icon
        icon={isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'}
        className="size-5 text-yellow-300"
      />
    </button>
  )
}
