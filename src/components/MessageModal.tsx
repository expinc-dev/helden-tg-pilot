import { GradientButton } from '@/components/GradientButton'

// Shared popup shell for join/lobby error & notice states. "Kembali" backs out
// (typically to the landing page); "Lanjut" just dismisses the modal in place.
export function MessageModal({
  title,
  message,
  onBack,
  onDismiss,
}: {
  title: string
  message: string
  onBack: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-8 backdrop-blur-md">
      <div
        className="w-full max-w-sm overflow-hidden rounded-lg border"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        <div
          className="flex items-center justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: '#353535', background: '#181818' }}
        >
          <h2 className="font-semibold text-yellow-400">{title}</h2>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-white/80">{message}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 rounded-lg border py-2.5 text-sm text-white"
              style={{ borderColor: '#353535', background: '#1B1B1B' }}
            >
              Kembali
            </button>
            <GradientButton type="button" onClick={onDismiss} className="flex-1 py-2.5 text-sm">
              Lanjut
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  )
}
