import { useEffect, useState } from 'react'

import type { VideoPlayback } from '@helden-inc/tg-schema'
import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

// Live playback state for the video phase — sessions/{id}/videoPlayback. Host
// is the sole writer (rules); central and host both read to drive their local
// <video>/iframe. Returns null when the node is absent (non-video phase or
// initial phase-open race).
export function useVideoPlayback(sessionId: string | undefined): VideoPlayback | null {
  const [state, setState] = useState<VideoPlayback | null>(null)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/videoPlayback`), (s) => {
      setState((s.val() ?? null) as VideoPlayback | null)
    })
  }, [sessionId])
  return state
}
