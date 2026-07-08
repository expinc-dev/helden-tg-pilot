import { ref, serverTimestamp, update } from 'firebase/database'
import type { PhasePointer } from '@helden-inc/tg-schema'
import { rtdb } from '@/lib/firebase'
import { demoBundle } from '@/lib/demoBundle'

export async function startSession(sessionId: string, hostUid = 'anon-host') {
  const firstPhase = demoBundle.phaseOrder[0]
  const pointer: PhasePointer = { activePhaseId: firstPhase, changedAt: Date.now(), changedBy: hostUid }
  await update(ref(rtdb, `sessions/${sessionId}`), {
    'meta/status': 'live',
    phasePointer: pointer,
  })
  // ponytail: serverTimestamp() unused here; client Date.now() is fine for pilot.
  // Swap to serverTimestamp() when timer-authority phases (T-timer) need it.
  void serverTimestamp
}

export async function nextPhase(sessionId: string, currentPhaseId: string | undefined, hostUid = 'anon-host') {
  const order = demoBundle.phaseOrder
  const idx = currentPhaseId ? order.indexOf(currentPhaseId) : -1
  const next = order[idx + 1]
  if (!next) return { done: true as const }
  const pointer: PhasePointer = { activePhaseId: next, changedAt: Date.now(), changedBy: hostUid }
  await update(ref(rtdb, `sessions/${sessionId}`), { phasePointer: pointer })
  return { done: false as const, activePhaseId: next }
}
