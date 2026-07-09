import type { Phase, PhasePointer, SessionTimer } from '@helden-inc/tg-schema'
import { onValue, ref, remove, set, update } from 'firebase/database'

import { demoBundle } from '@/lib/demoBundle'
import { rtdb } from '@/lib/firebase'

// .info/serverTimeOffset is listener-only — get() throws "Invalid token in path".
// Grab it with a one-shot onValue (serverTime − localTime, ms; 0 if unresolved).
// The callback can fire SYNCHRONOUSLY during onValue(), before its return value is
// assigned — so init unsub to a no-op and defer the real unsubscribe to a microtask.
function serverOffsetOnce(): Promise<number> {
  return new Promise((resolve) => {
    let unsub = () => {}
    let settled = false
    unsub = onValue(ref(rtdb, '.info/serverTimeOffset'), (s) => {
      if (settled) return
      settled = true
      resolve((s.val() as number | null) ?? 0)
      queueMicrotask(() => unsub())
    })
  })
}

// Host-only. On opening a phase, set the single server-authoritative timer node
// (offset-corrected endsAt) if the phase has a server timer, else clear any stale
// one. Written ONCE here — devices only read it. See sync/useTimer.ts.
async function openPhaseTimer(sessionId: string, phase: Phase | undefined) {
  const node = ref(rtdb, `sessions/${sessionId}/timer`)
  const t = phase?.timer
  if (!phase || !t || t.authority !== 'server' || t.seconds <= 0) {
    await remove(node)
    return
  }
  // Correct the host's local clock against the server before stamping the deadline.
  const offset = await serverOffsetOnce()
  const timer: SessionTimer = { phaseId: phase.id, endsAt: Date.now() + offset + t.seconds * 1000 }
  await set(node, timer)
}

export async function startSession(sessionId: string, hostUid = 'anon-host') {
  const firstPhase = demoBundle.phaseOrder[0]
  const pointer: PhasePointer = {
    activePhaseId: firstPhase,
    changedAt: Date.now(),
    changedBy: hostUid,
  }
  await update(ref(rtdb, `sessions/${sessionId}`), {
    'meta/status': 'live',
    phasePointer: pointer,
  })
  await openPhaseTimer(sessionId, demoBundle.phases[firstPhase])
}

export async function nextPhase(
  sessionId: string,
  currentPhaseId: string | undefined,
  hostUid = 'anon-host'
) {
  const order = demoBundle.phaseOrder
  const idx = currentPhaseId ? order.indexOf(currentPhaseId) : -1
  const next = order[idx + 1]
  if (!next) return { done: true as const }
  const pointer: PhasePointer = { activePhaseId: next, changedAt: Date.now(), changedBy: hostUid }
  await update(ref(rtdb, `sessions/${sessionId}`), { phasePointer: pointer })
  await openPhaseTimer(sessionId, demoBundle.phases[next])
  return { done: false as const, activePhaseId: next }
}
