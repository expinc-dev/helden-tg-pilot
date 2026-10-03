import { assets } from '@/assets'

import { FullscreenButton } from './FullscreenToggle'

// Player top bar, per Figma: 56px tall, 24px side padding, translucent dark
// fill with a #303030 bottom hairline; 14px-high wordmark on the left (or a
// custom `left` node such as a back chevron) and a 24px fullscreen button on
// the right.
export function PlayerAppBar({ left }: { left?: React.ReactNode }) {
  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between border-b pr-4 pl-6"
      style={{ borderColor: '#303030', background: 'rgba(8, 8, 8, 0.20)' }}
    >
      {left ?? (
        <img src={assets.images.logos.helden.sm} alt="Helden Inc." className="h-3.5 w-auto" />
      )}
      <FullscreenButton className="size-6 bg-black/[0.64]" iconClassName="size-3 text-[#FDDB00]" />
    </header>
  )
}
