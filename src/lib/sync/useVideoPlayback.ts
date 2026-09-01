import { useEffect, useState } from 'react'

import type { VideoPlayback } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

// Live playback state for the video phase — sessions/{id}/videoPlayback. Host
// is the sole writer (rules); central and host both read to drive their local
// <video>/iframe. Returns null when the node is absent (non-video phase or
// initial phase-open race).
export function useVideoPlayback(sessionId: string | undefined): VideoPlayback | null {
  const [state, setState] = useState<VideoPlayback | null>(null)
  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/videoPlayback`), (s) => {
      setState((s.val() ?? null) as VideoPlayback | null)
    })
  }, [sessionId])
  return state
}
