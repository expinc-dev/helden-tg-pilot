import { useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GradientButton } from '@/components/GradientButton'

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
  return (
    <>
      <GradientButton type="button" onClick={() => setOpen(true)} className={className}>
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
