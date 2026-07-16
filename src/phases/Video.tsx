import { useEffect, useRef, useState } from 'react'

import { assets } from '@/assets'
import { Header } from '@/pages/host/_shared/Header'
import type { VideoContent, VideoPlayback } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

import { pauseVideo, playVideo, setVideoPlayback } from '@/lib/session/videoControl'
import { useMyTeamId, useTeams } from '@/lib/sync/useTeams'
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
  playerId,
  allowTeams,
}: {
  content: VideoContent
  role: Role
  sessionId: string
  title: string
  playerId?: string
  allowTeams?: boolean
}) {
  const playback = useVideoPlayback(sessionId)
  const url = content.videoUrl

  // Host's local playback position — read by HostControls on click, written
  // by each provider's timeupdate handler. Central also carries a ref for
  // symmetry; it's just ignored (central never triggers writes).
  const positionRef = useRef<number>(0)

  if (role === 'player') {
    return <PlayerFoldIn sessionId={sessionId} playerId={playerId} allowTeams={allowTeams} />
  }

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
      {role === 'central' && state === 'paused' && <CentralPausedOverlay />}
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
    if (playing) {
      pauseVideo(sessionId, pos)
    } else {
      playVideo(sessionId, pos)
    }
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
// Passive screen shown to players while the video plays on the central big
// screen. Layout mirrors PlayerWaitingScreen: Helden logo top, big centered
// prompt, team pill at the bottom (only when this session has team mode on
// and this player is assigned to a team).
function PlayerFoldIn({
  sessionId,
  playerId,
  allowTeams,
}: {
  sessionId: string
  playerId: string | undefined
  allowTeams: boolean | undefined
}) {
  const myTeamId = useMyTeamId(sessionId, playerId ?? '')
  const teams = useTeams(sessionId)
  const myTeam = myTeamId ? teams.find((t) => t.id === myTeamId) : undefined
  const teamName = allowTeams && myTeam?.teamName ? myTeam.teamName : undefined
  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center bg-neutral-950 bg-cover bg-center p-6"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.player})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <DotLottieReact src={assets.lotties.heldenLogo} autoplay loop className="h-25 w-auto" />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1
          className="text-3xl font-bold text-white sm:text-4xl"
          style={{ textShadow: '0 0 16px rgba(255, 255, 255, 0.5)' }}
        >
          Perhatikan <span className="text-[#FFB800]">Layar Utama</span>
        </h1>
      </div>
      {teamName && (
        <div className="mb-10 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80">
          Tim {teamName}
        </div>
      )}
    </div>
  )
}

// ─── Host video screen ──────────────────────────────────────────────────────
// Mission Control layout: idle → controls → clean-playing → ended replay.
// Host owns position (seek buttons, draggable progress bar). Every position
// change writes to sessions/{id}/videoPlayback so central snaps in sync.
// "Tahap selanjutnya" is disabled until the video has played through to the
// end at least once — trainer must actually show the content.
//
// Rendered top-level from lobby so the full-bleed background escapes the
// standard live wrapper's padding (would leak parent bg as a white bar).
export function VideoHostScreen({
  sessionId,
  videoTitle,
  videoUrl,
  onAdvance,
}: {
  sessionId: string
  videoTitle: string
  videoUrl?: string
  onAdvance: () => void
}) {
  const playback = useVideoPlayback(sessionId)
  const state = playback?.state ?? 'paused'
  const positionSec = playback?.positionSec ?? 0

  const [ended, setEnded] = useState(false)
  const [confirm, setConfirm] = useState<null | 'replay' | 'advance'>(null)

  const provider = videoUrl ? detectProvider(videoUrl) : null
  const canAdvance = ended

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col gap-2 overflow-y-auto p-3 sm:p-5"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Header />

      <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-white/10 bg-[#08080833] p-4 sm:gap-5 sm:p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Video Control</h1>
          <p className="mx-auto mt-2 max-w-md text-xs text-white/70 sm:text-sm">
            Anda memegang kendali penuh atas video di layar utama.
          </p>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#121212]">
          {videoUrl && provider === 'direct' && (
            <HostDirectPlayer
              url={videoUrl}
              state={state}
              positionSec={positionSec}
              title={videoTitle}
              sessionId={sessionId}
              ended={ended}
              onEnded={() => setEnded(true)}
              onReplayRequest={() => setConfirm('replay')}
            />
          )}
          {videoUrl && provider === 'vimeo' && (
            <div className="aspect-video w-full">
              <VimeoPlayer
                url={videoUrl}
                state={state}
                positionSec={positionSec}
                muted
                role="host"
                positionRef={{ current: positionSec } as React.MutableRefObject<number>}
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setConfirm('advance')}
        disabled={!canAdvance}
        className="w-full rounded-lg bg-[#FFB800] py-4 text-center text-base font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-30 sm:py-[18px] sm:text-lg"
      >
        Tahap selanjutnya
      </button>

      {confirm === 'replay' && (
        <ConfirmModal
          title="Mulai ulang video"
          message="Apakah anda yakin untuk memulai ulang video?"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null)
            setEnded(false)
            setVideoPlayback(sessionId, 'playing', 0)
          }}
        />
      )}
      {confirm === 'advance' && (
        <ConfirmModal
          title="Lanjut ke tahap berikutnya"
          message="Apakah anda yakin untuk melanjutkan ke tahap berikutnya?"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null)
            onAdvance()
          }}
        />
      )}
    </div>
  )
}

// Integrated host-side direct video player. Owns the <video> element, drives
// it from RTDB videoPlayback, and writes back on play/pause/seek/replay.
// Overlays state machine:
//   never-played  → big centered Play button + "Klik untuk memulai video"
//   playing/paused (mid-video) → prev-10s / play-pause / next-10s (tap-toggle,
//                                3s auto-hide) + persistent progress bar
//   ended         → big centered Replay icon + confirmation popup on tap
function HostDirectPlayer({
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

  // Sync local <video> to RTDB state. Same drift guard as before to avoid
  // fighting the host's own writes.
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

  // Reset local currentTime when RTDB flips to a very different position
  // (e.g., after a replay to 0). Prevents the progress bar showing stale UI.
  useEffect(() => {
    if (!scrubbing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentTime(positionSec)
    }
  }, [positionSec, scrubbing])

  // Local timeupdate / duration / ended tracking.
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

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Confirmation modal ─────────────────────────────────────────────────────
function ConfirmModal({
  title,
  message,
  onCancel,
  onConfirm,
}: {
  title: string
  message: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/10 bg-[#121212] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-[#FFB800]">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup"
            className="text-white/60 hover:text-white"
          >
            <Icon icon="mdi:close" className="size-5" />
          </button>
        </div>
        <p className="text-sm text-white/80">{message}</p>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 py-3 text-sm font-semibold text-white"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-[#FFB800] py-3 text-sm font-bold text-black"
          >
            Lanjut
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Central paused overlay ─────────────────────────────────────────────────
// Rendered on top of the paused central <video>/iframe. Dims the frame so the
// pause message reads clearly while keeping the last-frame context visible.
// Purely visual — pointer-events-none so it never intercepts host input (host
// isn't on this screen anyway, but keeps intent explicit).
function CentralPausedOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/70 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-black/80 ring-1 ring-white/10">
        <Icon icon="mdi:pause" className="size-10 text-[#FFB800]" />
      </div>
      <h2 className="text-2xl font-bold text-[#FFB800] sm:text-3xl">Video dijeda</h2>
      <p className="text-sm text-white/80 sm:text-base">Menunggu instruksi dari host</p>
    </div>
  )
}
