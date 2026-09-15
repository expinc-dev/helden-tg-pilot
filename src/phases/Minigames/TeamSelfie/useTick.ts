import { useEffect, useState } from 'react'

/**
 * Re-renders on an interval, returning an incrementing counter.
 *
 * Used by the central selfie gallery to rotate pages when there are more teams
 * than the bento can hold. The counter (not a timestamp) is the state so the
 * value stays stable across renders and pages advance exactly once per period.
 *
 * `intervalMs <= 0` disables rotation.
 */
export function useTick(intervalMs: number): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) return
    const h = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(h)
  }, [intervalMs])

  return tick
}
