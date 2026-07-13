import { ref, runTransaction, serverTimestamp, set } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

import { type AnsweredNode, bumpAnswered } from './answeredBump'

// Aggregate-write path. Players never write `scores`/`teamScores` directly
// (BLUEPRINT_runtime §5 + BLUEPRINT_schema §7). They may only bump answeredCount,
// and only through a transaction that dedups by (qId, keyId). See answeredBump.ts
// for the pure updater + rules; this file is the Firebase wiring.

// Player-side answer submit. Two writes:
//   1. players/{playerId}/answers/{qId} — the raw answer (scoped: only own node)
//   2. aggregates/{answeredCount,answeredBy} — via transaction, deduped by keyId
// Live scores are NOT written here — ponytail: pilot computes scores at
// phase-boundary flush (see session/flush.ts). For live leaderboard, add a tx
// on aggregates/scores|teamScores/{keyId} calling scoreAnswer(...).
export async function submitAnswer(opts: {
  sessionId: string
  playerId: string
  keyId: string // playerId (individual) or teamId (team modes) — caller decides
  qId: string
  value: unknown
}): Promise<void> {
  const { sessionId, playerId, keyId, qId, value } = opts
  await set(ref(rtdb, `sessions/${sessionId}/players/${playerId}/answers/${qId}`), {
    value,
    submittedAt: serverTimestamp(),
  })
  await runTransaction(ref(rtdb, `sessions/${sessionId}/aggregates`), (prev: AnsweredNode | null) =>
    bumpAnswered(prev, qId, keyId)
  )
}
