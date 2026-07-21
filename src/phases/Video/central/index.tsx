import { useRef } from 'react'

import type { VideoContent } from '@helden-inc/tg-schema'

import { useVideoPlayback } from '@/lib/sync/useVideoPlayback'

import { detectProvider } from '../lib'
import { DirectPlayer, VimeoPlayer } from '../players'
import { CentralPausedOverlay } from './components/CentralPausedOverlay'

export function CentralVideo({ content, sessionId }: { content: VideoContent; sessionId: string }) {
  const playback = useVideoPlayback(sessionId)
  const url = content.videoUrl
  const positionRef = useRef<number>(0)

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
    <div className="fixed inset-0 z-0 bg-black">
      {provider === 'vimeo' ? (
        <VimeoPlayer
          url={url}
          state={state}
          positionSec={positionSec}
          muted={false}
          role="central"
          positionRef={positionRef}
        />
      ) : (
        <DirectPlayer
          url={url}
          state={state}
          positionSec={positionSec}
          muted={false}
          role="central"
          positionRef={positionRef}
        />
      )}
      {state === 'paused' && <CentralPausedOverlay />}
    </div>
  )
}
