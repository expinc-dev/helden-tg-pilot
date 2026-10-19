// Pure gate for the host's "move to the next phase" controls. No React/Firebase:
// runnable under tsx via checks/lib/session/advanceGate.selfcheck.ts.
//
// Why it exists: nextPhase() awaits the flush + played writes BEFORE the phase
// pointer moves (control.ts), so on a slow link the host screen sits unchanged
// for seconds after "Lanjutkan". The advance button sits in the same spot on
// 1C, 1D and the video that follows, so a host who taps again — reasonably
// thinking the first tap was lost — advances the NEXT phase each time the
// pointer lands, and phases (e.g. 1D) flash by. A per-phase lock cannot stop
// that: the second tap belongs to a different phase id. This gate is global:
//   • one advance at a time, from the tap until nextPhase has fully settled (a
//     second one, for ANY phase, waits for the first),
//   • a short dwell once the host can actually SEE the new phase, so taps still
//     aimed at the old screen cannot land on the new phase's button,
//   • a caller that is not on the phase the host is currently on is refused.
// Auto-advance (timer expiry, code solved) skips the dwell — it is not a human
// tap and must never be dropped — but still respects "one at a time".

export const ADVANCE_DWELL_MS = 1500
// A hung advance must not lock the host out for good.
export const ADVANCE_STALE_MS = 30_000

export type AdvanceSource = 'manual' | 'auto'

export type AdvanceGate = ReturnType<typeof createAdvanceGate>

export function createAdvanceGate(
  opts: { now?: () => number; dwellMs?: number; staleMs?: number } = {}
) {
  const now = opts.now ?? Date.now
  const dwellMs = opts.dwellMs ?? ADVANCE_DWELL_MS
  const staleMs = opts.staleMs ?? ADVANCE_STALE_MS

  // The phase the host screen is currently on (from the RTDB pointer).
  let seenPhase: string | null = null
  // Start of the current dwell: when the host could first see the phase the
  // pointer moved to. null until a change has been observed, so the very first
  // observation (page load) carries no dwell.
  let dwellFrom: number | null = null
  // The advance currently running. The token identifies THIS advance, so a late
  // settle from an older one (even for the same phase) cannot release it.
  let inFlight: { token: number; phaseId: string; since: number } | null = null
  let nextToken = 1

  const busyNow = () => inFlight !== null && now() - inFlight.since < staleMs
  const dwellRemaining = () => (dwellFrom === null ? 0 : Math.max(0, dwellFrom + dwellMs - now()))

  return {
    // Report the phase the pointer is on. This does NOT end an advance: Firebase
    // fires the local listener the moment the pointer is written, before
    // nextPhase has finished opening the new phase (timer, secrets, centralStep).
    // Only release() does, once the advance has fully settled — otherwise the next
    // advance would overlap those late writes.
    observe(phaseId: string | undefined) {
      if (!phaseId || phaseId === seenPhase) return
      if (seenPhase !== null) dwellFrom = now()
      seenPhase = phaseId
    },

    // A token when the caller may run its advance (and marks it in flight), or
    // null when it must not.
    tryStart(phaseId: string, source: AdvanceSource = 'manual'): number | null {
      if (busyNow()) return null
      // Stale caller: its screen is not the phase the host is on any more.
      if (seenPhase !== null && phaseId !== seenPhase) return null
      if (source === 'manual' && dwellRemaining() > 0) return null
      const token = nextToken++
      inFlight = { token, phaseId, since: now() }
      return token
    },

    // The advance holding `token` has settled — finished, failed, was refused as
    // stale, or ended the session. Only the owning token releases it.
    //
    // If the pointer left that phase meanwhile, the dwell restarts NOW: until
    // settling, the host's screen showed the "moving…" feedback rather than the
    // new phase, so this is the moment the host can first see it. Counting from
    // the pointer change instead would let a tap right as the screen appears
    // skip straight through it (seen under 2s RTT: 330ms on 1D).
    release(token: number) {
      if (!inFlight || inFlight.token !== token) return
      if (seenPhase !== inFlight.phaseId) dwellFrom = now()
      inFlight = null
    },

    busy: busyNow,
    dwellRemaining,
    // Controls should look disabled while an advance runs or the dwell is on.
    locked: () => busyNow() || dwellRemaining() > 0,

    // When time alone will change busy()/locked() next, in ms — the dwell ending
    // or a hung advance going stale — or null if nothing is pending. Neither
    // fires an event, so the UI re-checks on this timer.
    nextCheckInMs(): number | null {
      if (inFlight && busyNow()) return Math.max(0, inFlight.since + staleMs - now())
      const dwell = dwellRemaining()
      return dwell > 0 ? dwell : null
    },
  }
}
