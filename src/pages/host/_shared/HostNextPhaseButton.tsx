import { useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GradientButton } from '@/components/GradientButton'

// The one "go to next phase" control on the host. Every advance path renders
// this so the confirm popup is guaranteed and there is exactly one button.
export function HostNextPhaseButton({
  isLast = false,
  onConfirm,
  className = 'w-full py-4 text-base',
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
          title={isLast ? 'Akhiri sesi?' : 'Lanjut ke tahap berikutnya?'}
          message={
            isLast
              ? 'Sesi akan diakhiri untuk semua peserta. Tindakan ini tidak bisa dibatalkan.'
              : 'Tahap ini akan ditutup dan semua peserta pindah ke tahap berikutnya. Tindakan ini tidak bisa dibatalkan.'
          }
          confirmLabel={isLast ? 'Akhiri' : 'Lanjut'}
          cancelLabel="Batal"
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
