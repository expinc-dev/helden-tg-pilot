import { increment, ref, serverTimestamp, set, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

// Aggregate-write path. Players never write `scores`/`teamScores` directly
// (BLUEPRINT_runtime §5 + BLUEPRINT_schema §7). They may only bump answeredCount
// and distribution, and only for their own (qId, keyId).
//
// We used to `runTransaction` on `sessions/{id}/aggregates` (parent). That
// path replaces the entire subtree — Firebase then runs .validate on EVERY
// leaf including `scores/{playerId}` (host-only), so the player's own write
// gets permission_denied on the rerun as soon as scores exist. Instead we
// `update()` sparse deep paths — Firebase only validates the specific leaves
// we touch, `scores`/`teamScores` are never in the write set at all, and
// idempotency is enforced by the answeredBy .validate (`!data.exists()`)
// which atomically rejects a duplicate submit and rolls back the whole update.

export async function submitAnswer(opts: {
  sessionId: string
  playerId: string
  keyId: string // playerId (individual) or teamId (team modes) — caller decides
  qId: string
  value: unknown
  optionId?: string
}): Promise<void> {
  const { sessionId, playerId, keyId, qId, value, optionId } = opts
  await set(ref(rtdb, `sessions/${sessionId}/players/${playerId}/answers/${qId}`), {
    value,
    submittedAt: serverTimestamp(),
  })
  const patch: Record<string, unknown> = {
    [`answeredCount/${qId}`]: increment(1),
    [`answeredBy/${qId}/${keyId}`]: true,
  }
  if (optionId) patch[`distribution/${qId}/${optionId}`] = increment(1)
  try {
    await update(ref(rtdb, `sessions/${sessionId}/aggregates`), patch)
  } catch (err) {
    // Duplicate submit → answeredBy .validate rejects → whole update atomically
    // rolls back. Swallow: the player's raw answer is already saved above, and
    // this path is naturally idempotent from the caller's perspective.
    const msg = err instanceof Error ? err.message : String(err)
    if (!/permission_denied/i.test(msg)) throw err
  }
}
