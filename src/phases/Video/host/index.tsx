import { useCallback, useEffect, useRef, useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { HostNextPhaseButton } from '@/pages/host/_shared/HostNextPhaseButton'
import { HostScreenFrame } from '@/pages/host/_shared/HostScreenFrame'
import type { VideoContent } from '@helden-inc/tg-schema'

import { pauseVideo, playVideo, setVideoPlayback } from '@/lib/session/videoControl'
import { useVideoPlayback } from '@/lib/sync/useVideoPlayback'
import { estimatePositionSec } from '@/lib/sync/videoPosition'

import { detectProvider } from '../lib'
import { DirectPlayer, VimeoPlayer, YoutubePlayer } from '../players'
import { EmbedControls } from './components/EmbedControls'
import { HostControls } from './components/HostControls'
import { HostDirectPlayer } from './components/HostDirectPlayer'

export function HostVideo({
  content,
  sessionId,
  title,
}: {
  content: VideoContent
  sessionId: string
  title: string
}) {
  const playback = useVideoPlayback(sessionId)
  const url = content.videoUrl
  const positionRef = useRef<number>(0)

  if (!url) {
    return <div className="p-8 text-sm text-gray-500">URL video belum diisi untuk fase ini.</div>
  }

  const provider = detectProvider(url)
  const state = playback?.state ?? 'paused'
  const positionSec = playback?.positionSec ?? 0

  return (
    <div className="flex flex-col gap-4">
      {provider === 'vimeo' ? (
        <VimeoPlayer
          url={url}
          state={state}
          positionSec={positionSec}
          muted
          role="host"
          positionRef={positionRef}
        />
      ) : provider === 'youtube' ? (
        <YoutubePlayer
          url={url}
          state={state}
          positionSec={positionSec}
          muted
          role="host"
          positionRef={positionRef}
        />
      ) : (
        <DirectPlayer
          url={url}
          state={state}
          positionSec={positionSec}
          muted
          role="host"
          positionRef={positionRef}
        />
      )}
      <HostControls sessionId={sessionId} state={state} title={title} positionRef={positionRef} />
    </div>
  )
}

// How long a Vimeo/YouTube embed gets to say "ready" before the host is told it
// is not going to load (blocked network, embed privacy). The ready handshake is
// the only signal the embed gives, so no handshake = no position, no controls.
const EMBED_READY_TIMEOUT_MS = 10_000

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
  // Shared across the vimeo/youtube branches below — an inline
  // `{ current: positionSec }` literal, as this used to pass, is a fresh
  // object on every render, so the timeupdate position the players write back
  // via postMessage never survived the next render.
  const positionRef = useRef<number>(positionSec)

  const [ended, setEnded] = useState(false)
  const [confirm, setConfirm] = useState<null | 'replay'>(null)
  // Vimeo/YouTube's own postMessage timeupdate — NOT the RTDB-synced
  // positionSec, which only moves on an explicit play/pause/seek — is what
  // gives the seek bar the same smooth live movement HostDirectPlayer gets
  // for free from the native <video> element's timeupdate event.
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  // Default true (sama seperti perilaku lama): central-lah yang memutar audio
  // ke ruangan. Host bisa menyalakan suara di monitornya sendiri untuk cek
  // audio tanpa memengaruhi central.
  const [muted, setMuted] = useState(true)
  const toggleMute = () => setMuted((m) => !m)

  const provider = videoUrl ? detectProvider(videoUrl) : null

  const isEmbed = provider === 'vimeo' || provider === 'youtube'
  const [embedReady, setEmbedReady] = useState(false)
  const [embedTimedOut, setEmbedTimedOut] = useState(false)
  const markEmbedReady = useCallback(() => setEmbedReady(true), [])
  useEffect(() => {
    if (!isEmbed || embedReady) return
    const t = window.setTimeout(() => setEmbedTimedOut(true), EMBED_READY_TIMEOUT_MS)
    return () => window.clearTimeout(t)
  }, [isEmbed, embedReady])
  // A late `ready` still wins: the notice only shows while the embed has never
  // reported in.
  const embedFailed = isEmbed && embedTimedOut && !embedReady

  // No paused+0 reset on mount any more: openPhase (lib/session/control.ts ->
  // openPhaseVideoPlayback) already seeds every video phase as "paused at 0"
  // when it opens, so a video phase never inherits the previous one's state.
  // Writing it again here meant a host reload or any remount mid-video rewound
  // the central screen to 0 and paused it.

  // Where the room is, for every play/pause/seek write. NOT positionRef or the
  // embed's currentTime: those are the host's own muted embed, which stays at 0
  // (or lags) when it is buffering on a weaker network than the projector — and
  // pause then rewound central to that stale value. The playback node itself
  // (stored position + time since it was written) does not depend on the embed.
  const currentPositionSec = () => estimatePositionSec(playback, Date.now(), duration)
  const play = () => playVideo(sessionId, currentPositionSec())
  const pause = () => pauseVideo(sessionId, currentPositionSec())
  const seekBy = (delta: number) => {
    // Don't clamp against `duration` when it isn't known yet (0 before the
    // first timeupdate/getDuration response) — that would clamp every forward
    // seek straight back to 0. Vimeo/YouTube clamp out-of-range seeks to
    // their own real duration on their end regardless.
    const base = currentPositionSec()
    const next = duration > 0 ? Math.min(duration, base + delta) : base + delta
    const target = Math.max(0, next)
    // Move the seek bar to the target immediately rather than waiting for the
    // embed to report the new position. While paused the embed may not tick a
    // timeupdate at all, which left the thumb snapped back to where it was
    // before the seek (reported as "the bar jumps back to the left"). The
    // embed's own timeupdate still refines this once playback resumes.
    setCurrentTime(target)
    setVideoPlayback(sessionId, state, target)
  }
  const seekTo = (n: number) => {
    setCurrentTime(n)
    setVideoPlayback(sessionId, state, n)
  }

  return (
    <HostScreenFrame
      title="Mission Control"
      subtitle="Anda memegang kendali penuh atas video di layar utama."
      footer={
        <HostNextPhaseButton
          onConfirm={onAdvance}
          className="h-16 w-full shrink-0 text-lg font-medium! tracking-[-0.04em]"
        />
      }
    >
      <>
        <div className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#121212]">
          {videoUrl && provider === 'direct' && (
            <HostDirectPlayer
              url={videoUrl}
              state={state}
              positionSec={positionSec}
              playback={playback}
              title={videoTitle}
              sessionId={sessionId}
              ended={ended}
              muted={muted}
              onToggleMute={toggleMute}
              onEnded={() => setEnded(true)}
              onReplayRequest={() => setConfirm('replay')}
            />
          )}
          {videoUrl && provider === 'vimeo' && (
            <div className="relative h-full max-h-full min-h-0 w-full overflow-hidden">
              <VimeoPlayer
                url={videoUrl}
                state={state}
                positionSec={positionSec}
                muted={muted}
                role="host"
                positionRef={positionRef}
                onEnded={() => setEnded(true)}
                onTimeUpdate={setCurrentTime}
                onDuration={setDuration}
                onReady={markEmbedReady}
              />
              {embedFailed ? (
                <EmbedFailedNotice />
              ) : (
                <EmbedControls
                  state={state}
                  ended={ended}
                  currentTime={currentTime}
                  duration={duration}
                  muted={muted}
                  onToggleMute={toggleMute}
                  onPlay={play}
                  onPause={pause}
                  onSeekBy={seekBy}
                  onSeekTo={seekTo}
                  onReplayRequest={() => setConfirm('replay')}
                />
              )}
            </div>
          )}
          {videoUrl && provider === 'youtube' && (
            <div className="relative h-full max-h-full min-h-0 w-full overflow-hidden">
              <YoutubePlayer
                url={videoUrl}
                state={state}
                positionSec={positionSec}
                muted={muted}
                role="host"
                positionRef={positionRef}
                onEnded={() => setEnded(true)}
                onTimeUpdate={setCurrentTime}
                onDuration={setDuration}
                onReady={markEmbedReady}
              />
              {embedFailed ? (
                <EmbedFailedNotice />
              ) : (
                <EmbedControls
                  state={state}
                  ended={ended}
                  currentTime={currentTime}
                  duration={duration}
                  muted={muted}
                  onToggleMute={toggleMute}
                  onPlay={play}
                  onPause={pause}
                  onSeekBy={seekBy}
                  onSeekTo={seekTo}
                  onReplayRequest={() => setConfirm('replay')}
                />
              )}
            </div>
          )}
        </div>
      </>

      {confirm === 'replay' && (
        <ConfirmDialog
          title="Mulai ulang video"
          message="Apakah anda yakin untuk memulai ulang video?"
          confirmLabel="Ulangi"
          confirmIcon="mdi:refresh"
          cancelLabel="Kembali"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null)
            setEnded(false)
            setVideoPlayback(sessionId, 'playing', 0)
          }}
        />
      )}
    </HostScreenFrame>
  )
}

function EmbedFailedNotice() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/85 p-6 text-center">
      <p className="text-base font-semibold text-white">Video tidak dapat dimuat</p>
      <p className="text-sm text-white/70">
        Periksa koneksi internet host dan pengaturan privasi embed video, lalu muat ulang halaman
        ini. Selama video belum termuat, layar utama tidak akan memutar apa pun.
      </p>
    </div>
  )
}
