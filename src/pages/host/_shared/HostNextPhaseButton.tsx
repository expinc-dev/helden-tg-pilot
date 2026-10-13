import { useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GradientButton } from '@/components/GradientButton'

import { useAdvanceLocked } from './advanceGateContext'
import { NEXT_PHASE_CONFIRM } from './confirmCopy'

// The one "go to next phase" control on the host. Every advance path renders
// this so the confirm popup is guaranteed and there is exactly one button.
export function HostNextPhaseButton({
  isLast = false,
  onConfirm,
  className = 'h-16 w-full text-lg font-medium! tracking-[-0.04em]',
}: {
  isLast?: boolean
  onConfirm: () => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  // Disabled while an advance is running or just landed (see advanceGate.ts):
  // this button sits in the same spot on consecutive phases, so a tap still
  // aimed at the old screen must not open the confirm for the new one.
  const locked = useAdvanceLocked()
  // An open confirm must not outlive the screen it was opened on: once an advance
  // starts or has just landed (auto-advance, a second host tab), close it —
  // confirming it later would advance a phase the host never saw. Set during
  // render (React's way to reset state from a changed value) so it never flashes.
  if (locked && open) setOpen(false)
  return (
    <>
      <GradientButton
        type="button"
        disabled={locked}
        aria-busy={locked}
        onClick={() => setOpen(true)}
        className={className}
      >
        {isLast ? 'Akhiri Sesi' : 'Tahap Selanjutnya'}
      </GradientButton>
      {open && (
        <ConfirmDialog
          title={isLast ? 'Akhiri sesi?' : NEXT_PHASE_CONFIRM.title}
          message={
            isLast
              ? 'Sesi akan diakhiri untuk semua peserta. Tindakan ini tidak bisa dibatalkan.'
              : NEXT_PHASE_CONFIRM.message
          }
          confirmLabel={isLast ? 'Akhiri' : NEXT_PHASE_CONFIRM.confirmLabel}
          cancelLabel={NEXT_PHASE_CONFIRM.cancelLabel}
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            setOpen(false)
            onConfirm()
          }}
        />
      )}
    </>
  )
}
