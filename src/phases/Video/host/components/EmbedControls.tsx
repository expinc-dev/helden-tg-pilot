import { useRef, useState } from 'react'

import type { VideoPlayback } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { fmtTime } from '../../lib'

// Vimeo/YouTube embeds run with controls=0 (native chrome hidden — the host
// drives playback so the central screen they're synced to never shows
// competing native UI), so unlike HostDirectPlayer they'd otherwise render
// with no way to start, pause, replay or seek at all. Mirrors
// HostDirectPlayer's overlay 1:1 (same tap-to-reveal skip/play/pause row, same
// bottom seek bar) so host controls are identical across all three video
// providers — the currentTime/duration it seeks against come from the embed's
// own postMessage timeupdate, not the RTDB-synced positionSec, which only
// moves on an explicit play/pause/seek.
export function EmbedControls({
  state,
  ended,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeekBy,
  onSeekTo,
  onReplayRequest,
}: {
  state: VideoPlayback['state']
  ended: boolean
  currentTime: number
  duration: number
  onPlay: () => void
  onPause: () => void
  onSeekBy: (delta: number) => void
  onSeekTo: (n: number) => void
  onReplayRequest: () => void
}) {
  const [scrubbing, setScrubbing] = useState(false)
  const [scrubValue, setScrubValue] = useState(currentTime)
  const [controlsVisible, setControlsVisible] = useState(false)
  const hideTimer = useRef<number | null>(null)

  const flashControls = () => {
    setControlsVisible(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000)
  }

  const isPlaying = state === 'playing'
  const neverPlayed = !isPlaying && !ended && currentTime < 0.1
  const displayTime = scrubbing ? scrubValue : currentTime

  return (
    <div className="absolute inset-0 cursor-pointer" onClick={flashControls}>
      {neverPlayed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPlay()
            }}
            className="flex size-20 items-center justify-center rounded-full bg-black/80 ring-2 ring-white/40"
            aria-label="Mulai video"
          >
            <Icon icon="mdi:play" className="size-10 text-white" />
          </button>
          <span className="text-sm text-white/80">Klik untuk memulai video</span>
        </div>
      )}

      {ended && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onReplayRequest()
            }}
            className="flex size-20 items-center justify-center rounded-full bg-black/80 ring-2 ring-[#FFB800]/60"
            aria-label="Mulai ulang video"
          >
            <Icon icon="mdi:restart" className="size-10 text-[#FFB800]" />
          </button>
          <span className="text-sm text-white/80">Klik untuk memainkan kembali</span>
        </div>
      )}

      {!neverPlayed && !ended && controlsVisible && (
        <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/30">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSeekBy(-10)
            }}
            className="flex size-14 items-center justify-center rounded-full bg-black/70 text-white"
            aria-label="Mundur 10 detik"
          >
            <Icon icon="mdi:skip-previous" className="size-8" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (isPlaying) {
                onPause()
              } else {
                onPlay()
              }
            }}
            className="flex size-16 items-center justify-center rounded-full bg-black/70 text-white"
            aria-label={isPlaying ? 'Jeda' : 'Putar'}
          >
            <Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} className="size-10" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSeekBy(10)
            }}
            className="flex size-14 items-center justify-center rounded-full bg-black/70 text-white"
            aria-label="Maju 10 detik"
          >
            <Icon icon="mdi:skip-next" className="size-8" />
          </button>
        </div>
      )}

      {!neverPlayed && !ended && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 to-transparent p-3">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={displayTime}
            onPointerDown={(e) => {
              e.stopPropagation()
              setScrubValue(currentTime)
              setScrubbing(true)
            }}
            onPointerUp={(e) => e.stopPropagation()}
            onInput={(e) => {
              e.stopPropagation()
              setScrubValue(Number(e.currentTarget.value))
            }}
            onChange={(e) => {
              e.stopPropagation()
              setScrubbing(false)
              onSeekTo(Number(e.currentTarget.value))
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full accent-[#FFB800]"
            aria-label="Seek video"
          />
          <span className="text-xs text-white/80">
            {fmtTime(displayTime)} / {fmtTime(duration)}
          </span>
        </div>
      )}
    </div>
  )
}
