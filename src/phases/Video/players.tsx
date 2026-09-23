import { useEffect, useMemo, useRef } from 'react'

import type { VideoPlayback } from '@helden-inc/tg-schema'

import type { Role } from '../PhaseRouter'
import {
  VIMEO_END_EVENT,
  VIMEO_END_EVENT_LEGACY,
  VIMEO_TIME_UPDATE_EVENT,
  VIMEO_TIME_UPDATE_EVENT_LEGACY,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
} from './lib'

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
  onEnded,
  onTimeUpdate,
  onDuration,
}: {
  url: string
  state: VideoPlayback['state']
  positionSec: number
  muted: boolean
  role: Role
  positionRef: React.MutableRefObject<number>
  onEnded?: () => void
  onTimeUpdate?: (sec: number) => void
  onDuration?: (sec: number) => void
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)
  // Last duration Vimeo reported (via getDuration or timeupdate), used only
  // by the end-of-playback fallback below.
  const durationRef = useRef(0)
  // Always request the embed itself muted — browsers block autoplay otherwise
  // — and toggle actual volume afterwards via postMessage. Baking `muted` into
  // the src instead would change it on every toggle, reloading the iframe and
  // losing playback position and state.
  const embedUrl = useMemo(() => vimeoEmbedUrl(url, true), [url])
  // The message listener below is registered once (deps []), so it would
  // otherwise close over the first render's state/positionSec/muted. The
  // `ready` event routinely arrives *after* the host has already tapped play
  // (the iframe is still loading when the controls first render), and the
  // [state, positionSec] effect has already bailed out on readyRef being
  // false by then — so replaying those stale values here would drop the tap
  // and leave the video stuck on the "Klik untuk memulai video" overlay.
  const latestRef = useRef({ state, positionSec, muted })
  useEffect(() => {
    latestRef.current = { state, positionSec, muted }
  })

  const send = (method: string, value?: unknown) => {
    const iframe = ref.current
    if (!iframe?.contentWindow) return
    // Post a structured object, never a JSON string. The embed picks its
    // event-name dialect off the *type* of the envelope it just received:
    // its buildMessage() applies the legacy Froogaloop rename
    // (vq = {playProgress:'timeupdate', finish:'ended', seek:'seeked'}) only
    // when that inbound message arrived as a string. Stringifying here made
    // the embed emit every event under the legacy name, which our listener
    // never matched — the progress bar stayed pinned at 0s and "Tahap
    // selanjutnya" never enabled. Method replies such as getDuration are
    // exempt from the rename, which is why the duration arrived correctly
    // even while every event was being dropped.
    // player.js's own client posts the object too (stringifying only for
    // IE 8/9).
    const message: { method: string; value?: unknown } = { method }
    if (value !== undefined) message.value = value
    iframe.contentWindow.postMessage(message, '*')
  }

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Vimeo posts either a JSON string or an already-parsed object —
      // player.js's own parseMessageData accepts both. Only handling strings
      // would silently drop every event (ready included) if the shape ever
      // changed, leaving the video permanently unrecoverable.
      try {
        const msg = (typeof e.data === 'string' ? JSON.parse(e.data) : e.data) as {
          event?: string
          method?: string
          data?: { seconds?: number; duration?: number }
          value?: number
        } | null
        if (!msg || typeof msg !== 'object') return
        if (msg.event === 'ready') {
          readyRef.current = true
          send('addEventListener', 'timeupdate')
          send('addEventListener', VIMEO_END_EVENT)
          send('setCurrentTime', latestRef.current.positionSec)
          send('setVolume', latestRef.current.muted ? 0 : 1)
          // Belt-and-suspenders: timeupdate's payload carries duration too
          // (below), but that only arrives once playback ticks. Ask for it
          // directly so the seek bar and skip buttons have a real duration
          // immediately, before the video has ever played.
          send('getDuration')
          if (latestRef.current.state === 'playing') send('play')
        } else if (msg.method === 'getDuration' && typeof msg.value === 'number') {
          durationRef.current = msg.value
          onDuration?.(msg.value)
        } else if (
          (msg.event === VIMEO_TIME_UPDATE_EVENT || msg.event === VIMEO_TIME_UPDATE_EVENT_LEGACY) &&
          typeof msg.data?.seconds === 'number'
        ) {
          positionRef.current = msg.data.seconds
          onTimeUpdate?.(msg.data.seconds)
          if (typeof msg.data.duration === 'number') {
            durationRef.current = msg.data.duration
            onDuration?.(msg.data.duration)
          }
          // Fallback for the VIMEO_END_EVENT subscription above: timeupdate
          // reports the same seconds/duration pair (at the end it arrives as
          // seconds === duration), so reaching the final half-second also
          // enables "Tahap selanjutnya" even if that event were missed.
          // Deliberately not edge-guarded behind a ref: onEnded is
          // idempotent here (the host screen just sets a boolean), whereas a
          // latch would survive the host's replay — which resets the screen's
          // ended state to false — and silently swallow the finish of every
          // subsequent playthrough.
          if (durationRef.current > 0 && msg.data.seconds >= durationRef.current - 0.5) {
            onEnded?.()
          }
        } else if (msg.event === VIMEO_END_EVENT || msg.event === VIMEO_END_EVENT_LEGACY) {
          onEnded?.()
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
    // Always resend the seek. This effect only fires on an explicit
    // play/pause/seek action (positionSec is written to RTDB only then, never
    // on a natural playback tick), so there is no jitter risk — whereas the
    // old >0.5s-diff guard could silently swallow a legitimate seek when
    // positionRef.current, updated from Vimeo's own timeupdate, already
    // happened to sit near the target.
    send('setCurrentTime', positionSec)
    send(state === 'playing' ? 'play' : 'pause')
  }, [state, positionSec])

  useEffect(() => {
    if (!readyRef.current) return
    send('setVolume', muted ? 0 : 1)
  }, [muted])

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
  onEnded,
  onTimeUpdate,
  onDuration,
}: {
  url: string
  state: VideoPlayback['state']
  positionSec: number
  muted: boolean
  role: Role
  positionRef: React.MutableRefObject<number>
  onEnded?: () => void
  onTimeUpdate?: (sec: number) => void
  onDuration?: (sec: number) => void
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)
  const wasEndedRef = useRef(false)
  // Same reasoning as VimeoPlayer above: the embed always starts muted (the
  // autoplay requirement), then real mute state is driven by postMessage once
  // ready, so toggling it never changes the iframe src and reloads the player.
  const embedUrl = useMemo(() => youtubeEmbedUrl(url, true), [url])
  // See the matching comment in VimeoPlayer: the listener is registered once,
  // so it must read the current state/positionSec/muted rather than the first
  // render's, or a host tap made before the embed finishes loading is lost.
  const latestRef = useRef({ state, positionSec, muted })
  useEffect(() => {
    latestRef.current = { state, positionSec, muted }
  })

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
          info?: { currentTime?: number; playerState?: number; duration?: number }
        }
        if (msg.event === 'onReady') {
          readyRef.current = true
          send('seekTo', [latestRef.current.positionSec, true])
          send(latestRef.current.muted ? 'mute' : 'unMute')
          if (latestRef.current.state === 'playing') send('playVideo')
        } else if (msg.event === 'infoDelivery') {
          if (typeof msg.info?.currentTime === 'number') {
            positionRef.current = msg.info.currentTime
            onTimeUpdate?.(msg.info.currentTime)
          }
          // The IFrame API's infoDelivery payload carries duration alongside
          // currentTime once the player has metadata.
          if (typeof msg.info?.duration === 'number') onDuration?.(msg.info.duration)
          // YT.PlayerState.ENDED === 0. Edge-trigger on entering it so onEnded
          // fires once per playthrough, not on every infoDelivery tick that
          // still happens to report state 0.
          const ended = msg.info?.playerState === 0
          if (ended && !wasEndedRef.current) onEnded?.()
          wasEndedRef.current = ended
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
    // Always resend the seek — see the matching comment in VimeoPlayer above.
    send('seekTo', [positionSec, true])
    send(state === 'playing' ? 'playVideo' : 'pauseVideo')
  }, [state, positionSec])

  useEffect(() => {
    if (!readyRef.current) return
    send(muted ? 'mute' : 'unMute')
  }, [muted])

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
