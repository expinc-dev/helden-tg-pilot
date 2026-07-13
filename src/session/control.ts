import type { Phase, PhasePointer, SessionTimer } from '@helden-inc/tg-schema'
import { onValue, ref, remove, set, update } from 'firebase/database'

import { normalizeCode } from '@/phases/codecheck'

import { demoBundle } from '@/lib/demoBundle'
import { auth, rtdb } from '@/lib/firebase'

import { flushPhaseResults } from './flush'

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

// Host-only. Seeds sessions/{id}/secrets/{phaseId} for graded phase types whose
// answer key must never reach a player's client (BLUEPRINT_schema §7 — the
// Kahoot-style "answer is in the payload" leak). Written ONCE per phase-open,
// here on the host's device, from the SAME demoBundle every client already has
// — the secret itself was never hidden, but after this it's only ever compared
// server-side, inside a database.rules.json .validate rule the player's device
// has no read access to. See phases/CodeInput.tsx for the guess-side of this.
async function openPhaseSecrets(sessionId: string, phase: Phase | undefined) {
  if (!phase || phase.content.type !== 'codeinput') return
  const { expected, caseSensitive } = phase.content
  await set(
    ref(rtdb, `sessions/${sessionId}/secrets/${phase.id}`),
    normalizeCode(expected, caseSensitive)
  )
}

function requireHostUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('control.ts called before anonymous sign-in resolved')
  return uid
}

export async function startSession(sessionId: string) {
  const hostUid = requireHostUid()
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
  await Promise.all([
    openPhaseTimer(sessionId, demoBundle.phases[firstPhase]),
    openPhaseSecrets(sessionId, demoBundle.phases[firstPhase]),
  ])
}

export async function nextPhase(sessionId: string, currentPhaseId: string | undefined) {
  const hostUid = requireHostUid()
  const order = demoBundle.phaseOrder
  const idx = currentPhaseId ? order.indexOf(currentPhaseId) : -1
  const next = order[idx + 1]
  // Flush durable results for the outgoing phase BEFORE the pointer moves —
  // once phasePointer flips, clients navigate away and live/* may be reused.
  // Errors are logged but do not block advance: a failed flush is recoverable
  // (RTDB live/* still intact), a stuck host is not (BLUEPRINT_runtime §11).
  // ponytail: single host writes results; if host crashes mid-flush, a rejoined
  // host can re-flush from live/*. Upgrade path = Cloud Function on phasePointer.
  const outgoing = currentPhaseId ? demoBundle.phases[currentPhaseId] : undefined
  if (outgoing) {
    try {
      await flushPhaseResults(sessionId, outgoing)
    } catch (e) {
      console.error('flushPhaseResults failed for', outgoing.id, e)
    }
  }
  if (!next) {
    // Last phase done → end the session. Flush already ran above; timer cleared
    // so useTimer doesn't show a stale phase deadline on the end screen.
    await Promise.all([
      update(ref(rtdb, `sessions/${sessionId}/meta`), { status: 'ended' }),
      remove(ref(rtdb, `sessions/${sessionId}/timer`)),
    ])
    return { done: true as const }
  }
  const pointer: PhasePointer = { activePhaseId: next, changedAt: Date.now(), changedBy: hostUid }
  await update(ref(rtdb, `sessions/${sessionId}`), { phasePointer: pointer })
  await Promise.all([
    openPhaseTimer(sessionId, demoBundle.phases[next]),
    openPhaseSecrets(sessionId, demoBundle.phases[next]),
  ])
  return { done: false as const, activePhaseId: next }
}
