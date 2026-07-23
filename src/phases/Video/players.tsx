import { useEffect, useRef } from 'react'

import type { VideoPlayback } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'
import { vimeoEmbedUrl, youtubeEmbedUrl } from './lib'

export function DirectPlayer({
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

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onTimeUpdate = () => {
      positionRef.current = el.currentTime
    }
    el.addEventListener('timeupdate', onTimeUpdate)
    return () => el.removeEventListener('timeupdate', onTimeUpdate)
  }, [positionRef])

  useEffect(() => {
    const el = ref.current
    if (el) el.currentTime = 0
  }, [])

  useEffect(() => {
    const el = ref.current
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

export function VimeoPlayer({
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

export function YoutubePlayer({
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
  const embedUrl = youtubeEmbedUrl(url, muted)

  const send = (func: string, args?: unknown[]) => {
    const iframe = ref.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func, args: args ?? [] }),
      '*'
    )
  }

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return
      try {
        const msg = JSON.parse(e.data) as {
          event?: string
          info?: { currentTime?: number }
        }
        if (msg.event === 'onReady') {
          readyRef.current = true
          send('seekTo', [positionSec, true])
          if (state === 'playing') send('playVideo')
        } else if (msg.event === 'infoDelivery' && typeof msg.info?.currentTime === 'number') {
          positionRef.current = msg.info.currentTime
        }
      } catch {
        /* YouTube sometimes sends non-JSON strings, ignore */
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!readyRef.current) return
    if (Math.abs(positionRef.current - positionSec) > 0.5) {
      send('seekTo', [positionSec, true])
    }
    send(state === 'playing' ? 'playVideo' : 'pauseVideo')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, positionSec])

  return (
    <iframe
      ref={ref}
      src={embedUrl}
      onLoad={() => send('listening')}
      allow="autoplay; fullscreen; picture-in-picture"
      className={
        role === 'central' ? 'h-full w-full border-0' : 'aspect-video w-full rounded-lg border-0'
      }
      title="Video"
    />
  )
}
