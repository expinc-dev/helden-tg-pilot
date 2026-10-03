import type { ReactNode } from 'react'

import { assets } from '@/assets'

// Central "gallery" frame (Figma Gallery - Central Screen, 1920×1080): the
// central background, one big panel (rgba(8,8,8,.2), 1px #353535, radius 16)
// with a gold gradient title (54, bold, -0.04em), a light 24 subtitle and the
// content below. Sizes are in vw so it scales to any projector. Shared by the
// team-selfie and soul-card (doubt_seed) galleries.
export function CentralGalleryFrame({
  title,
  subtitle,
  children,
}: {
  title?: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 bg-[#1e1e1e] bg-cover bg-center"
      style={{ backgroundImage: `url(${assets.images.backgrounds.central})` }}
    >
      <div className="absolute top-[8.9vh] left-1/2 flex h-[86vh] w-[95.4vw] -translate-x-1/2 flex-col items-center gap-[2.8vw] overflow-hidden rounded-2xl border border-[#353535] bg-[rgba(8,8,8,0.2)] px-[1.667vw] pt-[2.6vw] pb-[1.667vw]">
        {(title || subtitle) && (
          <header className="flex w-full shrink-0 flex-col items-center gap-[0.833vw] text-center">
            {title && (
              <h1
                className="bg-clip-text text-[2.8125vw] leading-[1.2] font-bold tracking-[-0.04em] text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(167deg, rgb(253, 219, 0) 14.619%, rgb(253, 164, 0) 68.407%)',
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[1.25vw] leading-[1.2] font-light tracking-[-0.04em] text-[#ccc]">
                {subtitle}
              </p>
            )}
          </header>
        )}
        <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}
