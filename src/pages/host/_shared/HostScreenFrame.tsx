import type { ReactNode } from 'react'

import { assets } from '@/assets'

import { Header } from './Header'
import { HostBadge } from './HostBadge'

// Figma "Interactive Screen-Host" (834×1194): bordered glass card inset 47/48
// from the edges, optional badge + title + subtitle header, body, and a
// full-width action button 40px below the card. Every host screen that sits in
// that shell renders through here so spacing, type and colours stay identical.
export function HostScreenFrame({
  badge,
  title,
  subtitle,
  children,
  footer,
  bodyClassName = '',
}: {
  // Text after "Host - " in the pill; omit for a bare "Host".
  badge?: string
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  bodyClassName?: string
}) {
  return (
    <div
      className="relative flex h-dvh w-full flex-col gap-10 overflow-hidden px-[47px] pt-[48px] pb-[45px] lg:h-full"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute top-[10px] right-[10px] z-10">
        <Header />
      </div>

      <div className="flex min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#353535_transparent] flex-col gap-16 overflow-y-auto rounded-2xl border border-[#353535] bg-[rgba(8,8,8,0.2)] px-8 pt-10 pb-8">
        {(badge !== undefined || title) && (
          <HostPanelHeader badge={badge} title={title} subtitle={subtitle} />
        )}
        <div className={`flex min-h-0 flex-1 flex-col ${bodyClassName}`}>{children}</div>
      </div>

      {footer}
    </div>
  )
}

// Pill + 32px title + 24px subtitle block shared by every host card.
export function HostPanelHeader({
  badge,
  title,
  subtitle,
}: {
  // `null` hides the pill (Reflection/summary screens have none).
  badge?: string | null
  title?: string
  subtitle?: string
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-12">
      {badge !== null && <HostBadge pageName={badge} />}
      {title && (
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-[32px] leading-normal font-bold tracking-[-0.04em] text-[#d9d9d9]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-2xl leading-[23px] font-light tracking-[-0.04em] text-[#ccc]">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
