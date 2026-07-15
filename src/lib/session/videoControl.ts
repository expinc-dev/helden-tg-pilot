import type { VideoPlayback } from '@helden-inc/tg-schema'
import { ref, set } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

// Host-only writers for sessions/{id}/videoPlayback. Enforcement is at the
// rules layer (only auth.uid === meta.hostUid); these helpers just wrap the
// write path so callers don't hand-roll the ref/shape.
//
// positionSec: host's local <video>.currentTime (or Vimeo equivalent) at the
// moment of the click. Devices seek to this value before applying state —
// this snaps central and host preview to the same frame on every transition.
export function setVideoPlayback(
  sessionId: string,
  state: 'playing' | 'paused',
  positionSec: number
): Promise<void> {
  const value: VideoPlayback = { state, updatedAt: Date.now(), positionSec }
  return set(ref(rtdb, `sessions/${sessionId}/videoPlayback`), value)
}

export function playVideo(sessionId: string, positionSec: number): Promise<void> {
  return setVideoPlayback(sessionId, 'playing', positionSec)
}

export function pauseVideo(sessionId: string, positionSec: number): Promise<void> {
  return setVideoPlayback(sessionId, 'paused', positionSec)
}
