import { useCallback, useEffect, useRef, useState } from 'react'

import { Icon } from '@iconify/react'

import { fileToCanvas, hasLiveCamera } from '@/lib/camera'
import {
  type CompressOptions,
  DEFAULT_COMPRESS,
  compressToJpegDataUrl,
} from '@/lib/selfie/compress'

// Selfie capture (HLN-018) — the front-camera sibling of ScannerPopup.
//
// Deliberately a separate component rather than a mode flag on ScannerPopup:
// that one is tuned for scanning (back camera, centre-square crop, feeds a
// hash/QR detector) and both of its callers are load-bearing phases. Sharing
// them would mean re-verifying QR and pattern scanning to ship a selfie, so
// the ~20 lines of getUserMedia plumbing are duplicated on purpose.
//
// Layout follows the "Selfie v1" Figma frame: camera viewport filling the
// card, a dark overlay bar at the bottom holding thumbnail / shutter / flip.

type Facing = 'user' | 'environment'

export function SelfieCapture({
  title,
  instructions,
  actionLabel,
  compress,
  onSave,
  onClose,
  error,
  canSave = true,
}: {
  title: string
  instructions: string
  actionLabel: string
  compress?: CompressOptions
  onSave: (dataUrl: string) => void | Promise<void>
  onClose: () => void
  // Save failure to show under the button (the caller owns the write).
  error?: string | null
  // False while the caller is not ready to accept a photo (e.g. team not loaded).
  canSave?: boolean
}) {
  const [facing, setFacing] = useState<Facing>('user')
  const [shot, setShot] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!shot || busy) return
    setBusy(true)
    try {
      await onSave(shot)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-helden-base flex min-h-dvh flex-col p-6 text-white">
      {/* Card shell — 16px radius, matches the Figma container. */}
      <div className="bg-helden-surface-gradient relative mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden rounded-2xl p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-5 right-5 z-10 flex size-9 items-center justify-center rounded-full bg-[#000000]/64 text-white/80 hover:text-white"
        >
          <Icon icon="mdi:close" className="size-5" />
        </button>

        <h2 className="text-helden-title text-center text-[28px] leading-9 font-bold tracking-tight">
          {title}
        </h2>
        <p className="text-helden-sub mt-2 text-center text-base leading-6 font-light">
          {instructions}
        </p>

        {/* Keyed on `facing`: flipping the camera remounts the whole pane, so
            the stream effect starts from clean state instead of having to
            reset it synchronously (which React flags as a cascading render). */}
        <CameraPane
          key={facing}
          facing={facing}
          shot={shot}
          compress={compress}
          onCapture={setShot}
          onRetake={() => setShot(null)}
          onFlip={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
        />
      </div>

      <div className="mx-auto mt-6 w-full max-w-md">
        <button
          type="button"
          onClick={save}
          disabled={!shot || busy || !canSave}
          className="bg-helden-yellow-gradient h-16 w-full rounded-lg text-lg font-medium text-black disabled:opacity-40"
        >
          {busy ? 'Menyimpan…' : actionLabel}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

// Owns the getUserMedia stream. A fresh instance is mounted per `facing` value,
// so `ready`/`error` only ever start at their defaults here — no reset needed.
function CameraPane({
  facing,
  shot,
  compress,
  onCapture,
  onRetake,
  onFlip,
}: {
  facing: Facing
  shot: string | null
  compress?: CompressOptions
  onCapture: (dataUrl: string) => void
  onRetake: () => void
  onFlip: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // Insecure context (LAN HTTP): no live preview — the shutter opens the
  // device's own camera app instead (see lib/camera.ts).
  const live = hasLiveCamera()
  const [error, setError] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!live) return
    let cancelled = false
    let stream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          setReady(true)
        }
      })
      .catch(() => setError(true))

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [facing, live])

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      const canvas = await fileToCanvas(file)
      if (!canvas) {
        setError(true)
        return
      }
      const url = compressToJpegDataUrl(canvas, { ...DEFAULT_COMPRESS, ...compress, mirror: false })
      if (url) onCapture(url)
    },
    [compress, onCapture]
  )

  const capture = useCallback(() => {
    if (!live) {
      fileRef.current?.click()
      return
    }
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    // Mirror only the front camera — the preview is CSS-flipped, so an
    // un-mirrored capture would not match what the player just saw.
    const url = compressToJpegDataUrl(video, {
      ...DEFAULT_COMPRESS,
      ...compress,
      mirror: facing === 'user',
    })
    if (url) onCapture(url)
  }, [compress, facing, live, onCapture])

  return (
    <>
      {/* Camera viewport / captured preview. */}
      <div className="bg-helden-photo-gradient relative mt-8 flex-1 overflow-hidden rounded-2xl">
        {error ? (
          <div className="flex size-full items-center justify-center px-8 text-center text-sm text-red-400">
            Tidak bisa mengakses kamera. Cek izin kamera di browser.
          </div>
        ) : shot ? (
          <img src={shot} alt="" className="size-full object-cover" />
        ) : !live ? (
          <div className="flex size-full items-center justify-center px-8 text-center text-sm text-white/70">
            Ketuk tombol kuning untuk membuka kamera perangkat dan mengambil foto tim.
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`size-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`}
          />
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {/* Bottom bar: thumbnail (retake) · shutter · flip. */}
      <div className="mt-6 flex items-center justify-between rounded-lg bg-[#080808]/80 px-8 py-5">
        <button
          type="button"
          onClick={onRetake}
          disabled={!shot}
          aria-label="Ulangi"
          className="size-20 shrink-0 overflow-hidden rounded border border-white/20 bg-white/5 disabled:opacity-40"
        >
          {shot ? (
            <img src={shot} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-white/30">
              <Icon icon="mdi:image-outline" className="size-6" />
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={capture}
          disabled={error || (live && !ready) || !!shot}
          aria-label="Ambil foto"
          className="bg-helden-yellow-gradient flex size-16 items-center justify-center rounded-full disabled:opacity-40"
        >
          <span className="size-12 rounded-full border-4 border-black/30" />
        </button>

        <button
          type="button"
          onClick={onFlip}
          disabled={!!shot || !live}
          aria-label="Ganti kamera"
          className="flex size-[74px] shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 hover:text-white disabled:opacity-40"
        >
          <Icon icon="mdi:camera-flip-outline" className="size-7" />
        </button>
      </div>
    </>
  )
}
