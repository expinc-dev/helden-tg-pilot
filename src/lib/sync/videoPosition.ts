// Pure position math for the synced video phase, firebase-free so it is
// unit-testable (see checks/lib/sync/videoPosition.selfcheck.ts).
//
// sessions/{id}/videoPlayback only changes on an explicit host action, so while
// `state === 'playing'` its positionSec is the position AT updatedAt, not now.
// The host's own embed is a bad clock for "where is the room": it is muted,
// often on a weaker network than the projector, and reports nothing while
// buffering. So the host derives the position from the node itself: the stored
// position plus the time elapsed since it was written. Both timestamps come
// from the same host clock, so there is no skew to correct.

export type PlaybackSnapshot = {
  state: 'playing' | 'paused'
  positionSec?: number
  updatedAt?: number
}

export function estimatePositionSec(
  playback: PlaybackSnapshot | null,
  nowMs: number,
  durationSec?: number
): number {
  const base = Math.max(0, playback?.positionSec ?? 0)
  const elapsedSec =
    playback?.state === 'playing' && typeof playback.updatedAt === 'number'
      ? Math.max(0, (nowMs - playback.updatedAt) / 1000)
      : 0
  const pos = base + elapsedSec
  // Duration is 0 until the embed reports it; never clamp against an unknown one.
  return durationSec !== undefined && durationSec > 0 ? Math.min(pos, durationSec) : pos
}
