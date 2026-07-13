import { useEffect, useState } from 'react'

import type { Phase, SessionTimer } from '@helden-inc/tg-schema'
import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

import { remainingMs } from './timermath'

export { remainingMs }

// RTDB built-in: estimated (serverTime - localTime) in ms. 0 until it resolves.
export function useServerOffset(): number {
  const [offset, setOffset] = useState(0)
  useEffect(() => onValue(ref(rtdb, '.info/serverTimeOffset'), (s) => setOffset(s.val() ?? 0)), [])
  return offset
}

export type TimerState = {
  active: boolean // a server timer is set for THIS phase
  remainingMs: number
  remainingSec: number
  expired: boolean
}

// Server-authoritative countdown for `phase`. Subscribes to the single timer node
// + serverTimeOffset; one interval drives display re-render only (not authority).
// Ignores a stale timer whose phaseId != phase.id.
export function useTimer(sessionId: string | undefined, phase: Phase | null): TimerState {
  const offset = useServerOffset()
  const [timer, setTimer] = useState<SessionTimer | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/timer`), (s) => setTimer(s.val()))
  }, [sessionId])

  const active = !!phase && !!timer && timer.phaseId === phase.id

  // Display tick — re-render every 250ms while a timer is active. Not the source
  // of truth; remaining is always recomputed from endsAt on each render.
  useEffect(() => {
    if (!active) return
    const h = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(h)
  }, [active])

  if (!active || !timer) {
    return { active: false, remainingMs: 0, remainingSec: 0, expired: false }
  }
  const ms = Math.max(0, remainingMs(timer.endsAt, now, offset))
  return {
    active: true,
    remainingMs: ms,
    remainingSec: Math.ceil(ms / 1000),
    expired: ms <= 0,
  }
}
