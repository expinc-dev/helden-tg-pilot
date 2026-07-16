import { Icon } from '@iconify/react'

import { GradientButton } from './GradientButton'
import { Modal } from './Modal'

// Confirm-shaped modal: title + one message + [Cancel][Confirm]. Composes
// <Modal> for the shell. `danger` swaps the confirm button from gradient
// yellow to solid red — title stays yellow so the modal identity holds.
// Both buttons take optional iconify icons (rendered left of the label).
// confirmLabel is required by design — every caller declares intent.

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmIcon,
  cancelLabel = 'Batal',
  cancelIcon,
  onConfirm,
  onCancel,
  danger = false,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmIcon?: string
  cancelLabel?: string
  cancelIcon?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-white/80">{message}</p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm text-white"
          style={{ borderColor: '#353535', background: '#1B1B1B' }}
        >
          {cancelIcon && <Icon icon={cancelIcon} className="size-4" />}
          {cancelLabel}
        </button>
        {danger ? (
          <button
            type="button"
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#E21B3C] py-2.5 text-sm font-semibold text-white transition hover:bg-[#C4142F]"
          >
            {confirmIcon && <Icon icon={confirmIcon} className="size-4" />}
            {confirmLabel}
          </button>
        ) : (
          <GradientButton
            type="button"
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm"
          >
            {confirmIcon && <Icon icon={confirmIcon} className="size-4" />}
            {confirmLabel}
          </GradientButton>
        )}
      </div>
    </Modal>
  )
}
