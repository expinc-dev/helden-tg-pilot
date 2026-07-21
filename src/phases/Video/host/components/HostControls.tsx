import type { VideoPlayback } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { pauseVideo, playVideo } from '@/lib/session/videoControl'

export function HostControls({
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
