import { assets } from '@/assets'
import { Icon } from '@iconify/react'

import { PlayerAppBar } from './PlayerAppBar'

const BORDER = '#353535'
const PANEL_BG = 'rgba(8, 8, 8, 0.20)'

// Player question frame: auth background, app bar (logo left, fullscreen
// right), a bordered rounded panel for the content and an optional footer
// (action button) below it. Shared by the microlearning question screen and
// the quiz answering stage.
export function PlayerScreenFrame({
  children,
  footer,
  panelClassName = 'gap-10 px-5 pt-10 pb-5',
  bare = false,
  onBack,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  panelClassName?: string
  // No bordered panel: content sits directly on the page (Figma "Instruction"
  // screens — photo + title + steps, 20px side padding).
  bare?: boolean
  // When set, a back chevron replaces the logo (design: step 2+ of a flow).
  onBack?: () => void
}) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-cover bg-top"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <PlayerAppBar
        left={
          onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali"
              className="flex size-6 items-center justify-center text-white/80 hover:text-white"
            >
              <Icon icon="mdi:chevron-left" className="size-6" />
            </button>
          ) : undefined
        }
      />
      <div className={`flex min-h-0 flex-1 flex-col gap-8 pb-[52px] ${bare ? '' : 'px-5 pt-5'}`}>
        {bare ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-5">
            {children}
          </div>
        ) : (
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border ${panelClassName}`}
            style={{ borderColor: BORDER, background: PANEL_BG }}
          >
            {children}
          </div>
        )}
        {bare ? <div className="px-5">{footer}</div> : footer}
      </div>
    </div>
  )
}
