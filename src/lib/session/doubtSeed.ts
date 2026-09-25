import { serverTimestamp, set, update } from 'firebase/database'

import { type GalleryConfig, keepsVersionPrivate } from '@/phases/Minigames/DoubtSeed/score'

import { eref } from '@/lib/firebase'

// The one writer for a doubt-seed gallery answer:
// `sessions/{id}/players/{writerId}/answers/{phaseId}`.
//
// Doubt-seed is the first minigame with two separate writes to the same answer
// node — the arrangement itself, then the `shared` flag the player flips on the
// post-submit screen — so the node's shape lives here rather than being spelled
// out at each call site. The scorer reads the same node (score.ts): `value` is
// what it grades, `shared` is invisible to it.

/**
 * Write the arrangement. Called once, on submit.
 *
 * `shared` is only written when `keepsVersionPrivate` holds: the version starts
 * private and the player opts in afterwards. Otherwise the field is absent,
 * which is exactly what every pre-HLN-003 answer looks like — an absent flag
 * means "on the wall" to the gallery, so nothing about the old behaviour moves.
 */
export async function submitDoubtSeedAnswer(
  sessionId: string,
  writerId: string,
  phaseId: string,
  cardIds: string[],
  gallery: GalleryConfig
): Promise<void> {
  await set(eref(`sessions/${sessionId}/players/${writerId}/answers/${phaseId}`), {
    value: cardIds,
    submittedAt: serverTimestamp(),
    ...(keepsVersionPrivate(gallery) ? { shared: false } : {}),
  })
}

/**
 * Flip the keep-private flag after the fact.
 *
 * A merge, not a `set`: replacing the node would drop `value` and `submittedAt`
 * and take the player's own submission off the wall — and, worse, off the
 * scorer's read at flush time.
 */
export async function setDoubtSeedShared(
  sessionId: string,
  writerId: string,
  phaseId: string,
  shared: boolean
): Promise<void> {
  await update(eref(`sessions/${sessionId}/players/${writerId}/answers/${phaseId}`), { shared })
}
