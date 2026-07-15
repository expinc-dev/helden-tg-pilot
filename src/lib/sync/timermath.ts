// Pure timer math, firebase-free so it's unit-testable (see useTimer.selfcheck.ts).
// ms left on a server deadline as seen by THIS device. The local clock is never
// trusted directly — RTDB's serverTimeOffset (serverTime − localTime) corrects it,
// so two clients skewed ±30s compute the same value for one endsAt.
export function remainingMs(endsAt: number, nowLocal: number, serverOffset: number): number {
  return endsAt - (nowLocal + serverOffset)
}

// Formats whole seconds as m:ss (e.g. 65 -> "1:05").
export function mmss(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}
