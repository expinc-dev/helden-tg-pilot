import { useEffect, useRef, useState } from 'react'

import { assets } from '@/assets'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Header } from '@/pages/host/_shared/Header'
import type { VideoContent } from '@helden-inc/tg-schema'

import { pauseVideo, playVideo, setVideoPlayback } from '@/lib/session/videoControl'
import { useVideoPlayback } from '@/lib/sync/useVideoPlayback'

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
    return (
      <div className="p-8 text-sm text-gray-500">
        Video URL not set (content.videoUrl is empty for this slide).
      </div>
    )
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
  const [confirm, setConfirm] = useState<null | 'replay' | 'advance'>(null)
  // Vimeo/YouTube's own postMessage timeupdate — NOT the RTDB-synced
  // positionSec, which only moves on an explicit play/pause/seek — is what
  // gives the seek bar the same smooth live movement HostDirectPlayer gets
  // for free from the native <video> element's timeupdate event.
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const provider = videoUrl ? detectProvider(videoUrl) : null

  useEffect(() => {
    // sessions/{id}/videoPlayback is one global node per session, not scoped
    // per phase — so without this, a video phase entered right after another
    // one that was left mid-"playing" inherits that state and autoplays with
    // no host interaction at all. Forcing paused+0 here means every video
    // phase always starts requiring an explicit host tap.
    // (The component's own state — ended/currentTime/duration — is reset by
    // the key={phase.id} its callers pass, not here.)
    if (videoUrl) void setVideoPlayback(sessionId, 'paused', 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl])

  const play = () => playVideo(sessionId, positionRef.current)
  const pause = () => pauseVideo(sessionId, positionRef.current)
  const seekBy = (delta: number) => {
    // Don't clamp against `duration` when it isn't known yet (0 before the
    // first timeupdate/getDuration response) — that would clamp every forward
    // seek straight back to 0. Vimeo/YouTube clamp out-of-range seeks to
    // their own real duration on their end regardless.
    const next = duration > 0 ? Math.min(duration, currentTime + delta) : currentTime + delta
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
    <div
      className="relative flex h-dvh w-full flex-col gap-2 overflow-hidden p-3 sm:p-5 lg:h-full"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="shrink-0">
        <Header />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#08080833] p-3 sm:gap-4 sm:p-4">
        <h1 className="shrink-0 text-center text-lg font-bold text-white sm:text-xl">
          Video Control
        </h1>

        <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#121212]">
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
            <div className="relative h-full max-h-full min-h-0 w-full overflow-hidden">
              <VimeoPlayer
                url={videoUrl}
                state={state}
                positionSec={positionSec}
                muted
                role="host"
                positionRef={positionRef}
                onEnded={() => setEnded(true)}
                onTimeUpdate={setCurrentTime}
                onDuration={setDuration}
              />
              <EmbedControls
                state={state}
                ended={ended}
                currentTime={currentTime}
                duration={duration}
                onPlay={play}
                onPause={pause}
                onSeekBy={seekBy}
                onSeekTo={seekTo}
                onReplayRequest={() => setConfirm('replay')}
              />
            </div>
          )}
          {videoUrl && provider === 'youtube' && (
            <div className="relative h-full max-h-full min-h-0 w-full overflow-hidden">
              <YoutubePlayer
                url={videoUrl}
                state={state}
                positionSec={positionSec}
                muted
                role="host"
                positionRef={positionRef}
                onEnded={() => setEnded(true)}
                onTimeUpdate={setCurrentTime}
                onDuration={setDuration}
              />
              <EmbedControls
                state={state}
                ended={ended}
                currentTime={currentTime}
                duration={duration}
                onPlay={play}
                onPause={pause}
                onSeekBy={seekBy}
                onSeekTo={seekTo}
                onReplayRequest={() => setConfirm('replay')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Never disabled. The video is a host-side aid: the phase gate is
          phasePointer, players fold in from it, and nothing downstream reads
          `ended` — so gating this button on the video's end (vimeo/youtube only
          report it via postMessage) stranded a host on a video that is
          unwatchable in their room, with no way to skip. `ended` now only drives
          the replay overlay. */}
      <button
        type="button"
        onClick={() => setConfirm('advance')}
        className="w-full shrink-0 rounded-lg bg-[#FFB800] py-4 text-center text-base font-bold text-black transition-opacity sm:py-[18px] sm:text-lg"
      >
        Tahap selanjutnya
      </button>

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
      {confirm === 'advance' && (
        <ConfirmDialog
          title="Lanjut ke tahap berikutnya"
          message="Apakah anda yakin untuk melanjutkan ke tahap berikutnya?"
          confirmLabel="Lanjut"
          confirmIcon="mdi:arrow-right"
          cancelLabel="Kembali"
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
