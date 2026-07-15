import { useEffect, useRef } from 'react'

import type { VideoContent, VideoPlayback } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { pauseVideo, playVideo } from '@/lib/session/videoControl'
import { useVideoPlayback } from '@/lib/sync/useVideoPlayback'

import type { Role } from './PhaseRouter'

// Video phase renderer. Pilot scope: target=['central'] only — central full-
// bleed, host muted preview + play/pause, player passive fold-in. `mediaId`
// is not resolved (no CMS media pipeline yet); the pilot uses content.videoUrl.
//
// Provider detection is URL-sniffed: Vimeo URLs use an iframe + postMessage;
// everything else assumes a direct MP4/HLS source and uses <video>.
//
// Play/pause is host-only via database.rules.json. Central & host both listen
// to sessions/{id}/videoPlayback and drive their local player imperatively.
//
// Position sync: host is the authority. On every play/pause click the host
// stamps its own <video>.currentTime into videoPlayback.positionSec; central
// and host both seek to that value before applying state. Snaps everyone to
// the same frame on every transition; between transitions each device runs
// its own clock (small drift OK, next state change re-syncs).

export function VideoRenderer({
  content,
  role,
  sessionId,
  title,
}: {
  content: VideoContent
  role: Role
  sessionId: string
  title: string
}) {
  const playback = useVideoPlayback(sessionId)
  const url = content.videoUrl

  // Host's local playback position — read by HostControls on click, written
  // by each provider's timeupdate handler. Central also carries a ref for
  // symmetry; it's just ignored (central never triggers writes).
  const positionRef = useRef<number>(0)

  if (role === 'player') return <PlayerFoldIn title={title} />

  if (!url) {
    return (
      <div className="p-8 text-sm text-gray-500">
        Video URL not set (content.videoUrl absent; mediaId resolver pending).
      </div>
    )
  }

  const provider = detectProvider(url)
  const state = playback?.state ?? 'paused'
  const positionSec = playback?.positionSec ?? 0

  return (
    <div className={role === 'central' ? 'fixed inset-0 z-0 bg-black' : 'flex flex-col gap-4'}>
      {provider === 'vimeo' ? (
        <VimeoPlayer
          url={url}
          state={state}
          positionSec={positionSec}
          muted={role === 'host'}
          role={role}
          positionRef={positionRef}
        />
      ) : (
        <DirectPlayer
          url={url}
          state={state}
          positionSec={positionSec}
          muted={role === 'host'}
          role={role}
          positionRef={positionRef}
        />
      )}
      {role === 'host' && (
        <HostControls sessionId={sessionId} state={state} title={title} positionRef={positionRef} />
      )}
    </div>
  )
}

// ─── Provider detection ─────────────────────────────────────────────────────
function detectProvider(url: string): 'vimeo' | 'direct' {
  return /(?:^|\.)vimeo\.com\//.test(url) ? 'vimeo' : 'direct'
}

function vimeoEmbedUrl(url: string, muted: boolean): string {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (!m) return url
  const id = m[1]
  const params = new URLSearchParams({
    api: '1',
    background: '0',
    autoplay: '0',
    muted: muted ? '1' : '0',
    controls: '0',
  })
  return `https://player.vimeo.com/video/${id}?${params.toString()}`
}

// ─── Direct MP4/HLS via native <video> ───────────────────────────────────────
function DirectPlayer({
  url,
  state,
  positionSec,
  muted,
  role,
  positionRef,
}: {
  url: string
  state: VideoPlayback['state']
  positionSec: number
  muted: boolean
  role: Role
  positionRef: React.MutableRefObject<number>
}) {
  const ref = useRef<HTMLVideoElement>(null)

  // Track local playback position so HostControls can read it on click.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onTimeUpdate = () => {
      positionRef.current = el.currentTime
    }
    el.addEventListener('timeupdate', onTimeUpdate)
    return () => el.removeEventListener('timeupdate', onTimeUpdate)
  }, [positionRef])

  // Reset to 0 on mount — every phase-open remounts this component because
  // PhaseRouter switches renderers on phasePointer change.
  useEffect(() => {
    const el = ref.current
    if (el) el.currentTime = 0
  }, [])

  // Seek to host-authoritative position, then apply state. Runs on every
  // playback change (including positionSec change with same state, which is
  // effectively a re-sync signal).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Only seek if drift is meaningful — avoids fighting normal playback on
    // the host device (whose currentTime IS positionSec at the moment of the
    // write, minus write latency).
    if (Math.abs(el.currentTime - positionSec) > 0.5) {
      el.currentTime = positionSec
    }
    if (state === 'playing') {
      el.play().catch((err) => console.warn('video.play() blocked:', err))
    } else {
      el.pause()
    }
  }, [state, positionSec])

  return (
    <video
      ref={ref}
      src={url}
      muted={muted}
      playsInline
      className={role === 'central' ? 'h-full w-full object-contain' : 'w-full rounded-lg bg-black'}
    />
  )
}

// ─── Vimeo via iframe + postMessage ─────────────────────────────────────────
// Vimeo Player API: send JSON-string messages to the iframe's contentWindow.
// Docs: https://developer.vimeo.com/player/sdk/basics — the api=1 embed param
// exposes the same protocol without needing @vimeo/player. Methods used here:
// play, pause, setCurrentTime. Events subscribed: ready, timeupdate.
function VimeoPlayer({
  url,
  state,
  positionSec,
  muted,
  role,
  positionRef,
}: {
  url: string
  state: VideoPlayback['state']
  positionSec: number
  muted: boolean
  role: Role
  positionRef: React.MutableRefObject<number>
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)
  const embedUrl = vimeoEmbedUrl(url, muted)

  const send = (method: string, value?: unknown) => {
    const iframe = ref.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(JSON.stringify({ method, value }), '*')
  }

  // Subscribe to ready + timeupdate; ignore other events.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return
      try {
        const msg = JSON.parse(e.data) as {
          event?: string
          data?: { seconds?: number }
        }
        if (msg.event === 'ready') {
          readyRef.current = true
          // Vimeo requires explicit subscription for timeupdate events.
          send('addEventListener', 'timeupdate')
          send('setCurrentTime', positionSec)
          if (state === 'playing') send('play')
        } else if (msg.event === 'timeupdate' && typeof msg.data?.seconds === 'number') {
          positionRef.current = msg.data.seconds
        }
      } catch {
        /* Vimeo sometimes sends non-JSON strings, ignore */
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!readyRef.current) return
    // Only seek if drift is meaningful (same rationale as DirectPlayer).
    if (Math.abs(positionRef.current - positionSec) > 0.5) {
      send('setCurrentTime', positionSec)
    }
    send(state === 'playing' ? 'play' : 'pause')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, positionSec])

  return (
    <iframe
      ref={ref}
      src={embedUrl}
      allow="autoplay; fullscreen; picture-in-picture"
      className={
        role === 'central' ? 'h-full w-full border-0' : 'aspect-video w-full rounded-lg border-0'
      }
      title="Video"
    />
  )
}

// ─── Host controls ──────────────────────────────────────────────────────────
function HostControls({
  sessionId,
  state,
  title,
  positionRef,
}: {
  sessionId: string
  state: VideoPlayback['state']
  title: string
  positionRef: React.MutableRefObject<number>
}) {
  const playing = state === 'playing'
  const toggle = () => {
    const pos = positionRef.current
    if (playing) pauseVideo(sessionId, pos)
    else playVideo(sessionId, pos)
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#1C1C1E] px-4 py-3">
      <div className="flex flex-col">
        <span className="text-sm text-white/90">{title}</span>
        <span className="text-xs text-white/50">{playing ? 'Sedang diputar' : 'Berhenti'}</span>
      </div>
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 rounded-lg bg-[#FFB800] px-4 py-2 text-sm font-bold text-black"
      >
        <Icon icon={playing ? 'mdi:pause' : 'mdi:play'} className="size-5" />
        {playing ? 'Jeda' : 'Putar'}
      </button>
    </div>
  )
}

// ─── Player fold-in ─────────────────────────────────────────────────────────
function PlayerFoldIn({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <Icon icon="mdi:television" className="size-16 text-[#FFB800]" />
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="max-w-sm text-sm text-white/70">Lihat layar utama untuk menonton video.</p>
    </div>
  )
}
