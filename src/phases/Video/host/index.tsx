import { useRef, useState } from 'react'

import { assets } from '@/assets'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Header } from '@/pages/host/_shared/Header'
import type { VideoContent } from '@helden-inc/tg-schema'

import { setVideoPlayback } from '@/lib/session/videoControl'
import { useVideoPlayback } from '@/lib/sync/useVideoPlayback'

import { detectProvider } from '../lib'
import { DirectPlayer, VimeoPlayer, YoutubePlayer } from '../players'
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
          {videoUrl && provider === 'youtube' && (
            <div className="aspect-video w-full">
              <YoutubePlayer
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
