import { useEffect, useRef, useState } from 'react'

import type { VideoPlayback } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { pauseVideo, playVideo, setVideoPlayback } from '@/lib/session/videoControl'

import { fmtTime } from '../../lib'

export function HostDirectPlayer({
  url,
  state,
  positionSec,
  title,
  sessionId,
  ended,
  onEnded,
  onReplayRequest,
}: {
  url: string
  state: VideoPlayback['state']
  positionSec: number
  title: string
  sessionId: string
  ended: boolean
  onEnded: () => void
  onReplayRequest: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(positionSec)
  const [duration, setDuration] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(false)
  const hideTimer = useRef<number | null>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (Math.abs(el.currentTime - positionSec) > 0.5) {
      el.currentTime = positionSec
    }
    if (state === 'playing') {
      el.play().catch((err) => console.warn('video.play() blocked:', err))
    } else {
      el.pause()
    }
  }, [state, positionSec])

  useEffect(() => {
    if (!scrubbing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentTime(positionSec)
    }
  }, [positionSec, scrubbing])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onTime = () => {
      if (!scrubbing) setCurrentTime(el.currentTime)
    }
    const onMeta = () => setDuration(el.duration || 0)
    const onEnd = () => onEnded()
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('ended', onEnd)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('ended', onEnd)
    }
  }, [scrubbing, onEnded])

  const flashControls = () => {
    setControlsVisible(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000)
  }

  const isPlaying = state === 'playing'
  const neverPlayed = positionSec < 0.1 && !isPlaying && !ended && currentTime < 0.1

  const play = () => {
    playVideo(sessionId, currentTime)
  }

  const pause = () => {
    pauseVideo(sessionId, currentTime)
  }

  const seekBy = (delta: number) => {
    const next = Math.max(0, Math.min(duration || 0, currentTime + delta))
    setVideoPlayback(sessionId, state, next)
  }

  const seekTo = (n: number) => {
    setVideoPlayback(sessionId, state, n)
  }

  return (
    <div className="relative aspect-video w-full cursor-pointer bg-black" onClick={flashControls}>
      <video ref={videoRef} src={url} muted playsInline className="h-full w-full object-contain" />
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-3 text-sm text-white">
        {title}
      </div>

      {neverPlayed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              play()
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
              seekBy(-10)
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
                pause()
              } else {
                play()
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
              seekBy(10)
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
            value={currentTime}
            onPointerDown={() => setScrubbing(true)}
            onPointerUp={() => setScrubbing(false)}
            onInput={(e) => setCurrentTime(Number(e.currentTarget.value))}
            onChange={(e) => {
              setScrubbing(false)
              seekTo(Number(e.currentTarget.value))
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full accent-[#FFB800]"
            aria-label="Seek video"
          />
          <span className="text-xs text-white/80">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>
        </div>
      )}
    </div>
  )
}
