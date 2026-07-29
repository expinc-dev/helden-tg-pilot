import type { ReactNode } from 'react'

import { Icon } from '@iconify/react'

// Shared modal shell — dark card, yellow title bar strip, ✕ close top-right.
// Matches the presentation phase's AdvanceConfirm styling. Positioning is
// viewport-level (fixed inset-0) so it works from any render context. Backdrop
// click dismisses only when dismissOnBackdrop is on (off by default — confirm
// dialogs shouldn't lose intent to a stray tap).

export function Modal({
  title,
  onClose,
  dismissOnBackdrop = false,
  maxWidthClassName = 'max-w-sm',
  children,
}: {
  title: string
  onClose: () => void
  dismissOnBackdrop?: boolean
  maxWidthClassName?: string
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-8 backdrop-blur-md"
      onClick={dismissOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidthClassName} overflow-hidden rounded-lg border`}
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: '#353535', background: '#181818' }}
        >
          <h2 className="font-semibold text-yellow-400">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-white/70 hover:text-white"
          >
            <Icon icon="mdi:close" className="size-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
