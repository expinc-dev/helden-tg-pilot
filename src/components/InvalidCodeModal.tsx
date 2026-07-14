import { MessageModal } from '@/components/MessageModal'

// Shown on join pages (central, player) when a submitted room code doesn't
// resolve to a session.
export function InvalidCodeModal({
  message,
  onBack,
  onDismiss,
}: {
  message: string
  onBack: () => void
  onDismiss: () => void
}) {
  return (
    <MessageModal
      title="Ups! Kode Ruangan Salah"
      message={message}
      onBack={onBack}
      onDismiss={onDismiss}
    />
  )
}
