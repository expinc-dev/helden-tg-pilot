// Pure timer math, firebase-free so it's unit-testable (see useTimer.selfcheck.ts).
// ms left on a server deadline as seen by THIS device. The local clock is never
// trusted directly — RTDB's serverTimeOffset (serverTime − localTime) corrects it,
// so two clients skewed ±30s compute the same value for one endsAt.
export function remainingMs(endsAt: number, nowLocal: number, serverOffset: number): number {
  return endsAt - (nowLocal + serverOffset)
}
