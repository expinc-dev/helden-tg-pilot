import { assets } from '@/assets'

import { FullscreenButton } from './FullscreenToggle'

const BORDER = '#353535'
const PANEL_BG = 'rgba(8, 8, 8, 0.20)'

// Player question frame: auth background, app bar (logo left, fullscreen
// right), a bordered rounded panel for the content and an optional footer
// (action button) below it. Shared by the microlearning question screen and
// the quiz answering stage.
export function PlayerScreenFrame({
  children,
  footer,
  panelClassName = 'gap-6 p-6',
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  panelClassName?: string
}) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-cover bg-top"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <header
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: BORDER }}
      >
        <img src={assets.images.logos.helden.sm} alt="Helden Inc." className="h-8 w-auto" />
        <FullscreenButton className="size-9 bg-black/30" iconClassName="size-6 text-yellow-300" />
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl border ${panelClassName}`}
          style={{ borderColor: BORDER, background: PANEL_BG }}
        >
          {children}
        </div>
        {footer}
      </div>
    </div>
  )
}
