import { GradientButton } from '@/components/GradientButton'
import { Modal } from '@/components/Modal'

// Shown on join pages (central, player) when a submitted room code doesn't
// resolve to a session. Sengaja tanpa navigasi: X dan "Oke" sama-sama cuma
// menutup popup supaya user bisa mencoba kode lagi di halaman yang sama.
export function InvalidCodeModal({
  message,
  onDismiss,
}: {
  message: string
  onDismiss: () => void
}) {
  return (
    <Modal title="Ups! Kode Ruangan Salah" onClose={onDismiss}>
      <p className="text-sm text-white/80">{message}</p>
      <GradientButton type="button" onClick={onDismiss} className="mt-5 w-full py-2.5 text-sm">
        Oke
      </GradientButton>
    </Modal>
  )
}
