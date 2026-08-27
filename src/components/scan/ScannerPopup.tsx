import { useEffect, useRef, useState } from 'react'

import { Icon } from '@iconify/react'

// Full-screen live camera view — first getUserMedia usage in this app.
// Player taps the shutter to capture a frame; detection (QR decode / pattern
// hash) happens in the caller, this component only knows about pixels.
export function ScannerPopup({
  title,
  instructions,
  onCapture,
  onClose,
}: {
  title: string
  instructions: string
  onCapture: (frame: ImageData) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => setError('Tidak bisa mengakses kamera. Cek izin kamera di browser.'))

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    onCapture(ctx.getImageData(0, 0, canvas.width, canvas.height))
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="text-white/70 hover:text-white"
        >
          <Icon icon="mdi:close" className="size-6" />
        </button>
      </div>

      <div className="px-6 pt-2 text-center">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-white/70">{instructions}</p>
      </div>

      <div className="relative mt-4 flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center px-8 text-center text-sm text-red-400">
            {error}
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
        )}
      </div>

      <div className="flex justify-center py-8">
        <button
          type="button"
          onClick={capture}
          disabled={!!error}
          aria-label="Pindai"
          className="flex size-16 items-center justify-center rounded-full border-4 border-white bg-black disabled:opacity-40"
        >
          <Icon icon="mdi:camera" className="size-7 text-white" />
        </button>
      </div>
    </div>
  )
}
