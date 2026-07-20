import { get, onDisconnect, ref, serverTimestamp, set, update } from 'firebase/database'

import { auth, rtdb } from '@/lib/firebase'

import { type Member, reserveSlot } from './capacity'

type Role = 'player' | 'central'
export type JoinResult = { ok: true; leave: () => void } | { ok: false; reason: 'full' }

const ownersPath = (sessionId: string, role: Role) =>
  `sessions/${sessionId}/${role === 'player' ? 'playerOwners' : 'centralOwners'}`

// Claims (or re-confirms) that THIS auth.uid controls `id` for the rest of the
// session — the fact database.rules.json checks before allowing any write to
// players/{id} or centrals/{id}. Must land before the presence write below;
// rules for the ownership map itself only allow claiming an id that's unclaimed
// or already yours (see rules comments), so a stranger can never steal an id
// out from under an existing owner just by writing to it.
//
// This is deliberately reclaim-friendly for the SAME uid: it's what makes the
// rejoin-by-name fallback (findPlayerIdByName) keep working under rules — the
// common case (same browser, no sign-out) always presents the same anon uid,
// so re-claiming your own past identity, under a different locally-remembered
// name, still passes.
async function claimOwnership(sessionId: string, role: Role, id: string): Promise<void> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('claimOwnership called before anonymous sign-in resolved')
  await update(ref(rtdb, ownersPath(sessionId, role)), { [id]: uid })
}

// A device only remembers ONE player identity per session (lib/identity.ts's
// single localStorage slot) — join as a second named player on the same device
// and the first one's id is no longer remembered locally. The session's actual
// player list in RTDB is the durable source of truth, so a same-code-same-name
// rejoin falls back to it: find the existing player with this name and reuse
// their id instead of minting a new (empty-progress) one.
// Ambiguous if two players share a name — picks whichever the DB returns first,
// a known pilot-scale limitation, not a guarantee of uniqueness.
export async function findPlayerIdByName(sessionId: string, name: string): Promise<string | null> {
  const trimmed = name.trim()
  if (!trimmed) return null
  const snap = await get(ref(rtdb, `sessions/${sessionId}/players`))
  const players = (snap.val() ?? {}) as Record<string, { name?: string } | null>
  for (const [id, p] of Object.entries(players)) {
    if (p?.name === trimmed) return id
  }
  return null
}

// Caller owns a stable id (from localStorage) so refresh reuses the same RTDB node.
// isNew=true → first join, establish node + joinedAt. isNew=false → rejoin, merge
// presence fields only so selfStep/joinedAt survive (BLUEPRINT_runtime §7).
//
// Capacity is enforced by reading the collection and deciding BEFORE writing,
// not a transaction on the whole collection. A transaction there looked
// appealing for atomicity, but it's a trap: rules give every child its own
// ownership .validate (auth.uid === that id's owner), and RTDB re-validates
// EVERY sibling in the payload whenever a transaction reruns against fresher
// server data — which happens the moment a second member already exists. That
// rerun executes under the NEW joiner's auth, so the existing member's own
// node fails its own ownership check and the whole join gets permission_denied
// (same hazard submitAnswer.ts hit with sessions/{id}/aggregates). Reading
// first and writing only this id's own child avoids that entirely — no
// sibling is ever re-validated. Trades away strict atomicity (two joins
// landing in the same instant could both slip past the cap) for a fix that
// needs no rules change; an accepted pilot-scale tradeoff, same as the
// join-code collision odds documented in session/create.ts.
export async function joinPresence(
  sessionId: string,
  role: Role,
  id: string,
  opts: { isNew: boolean; name?: string }
): Promise<JoinResult> {
  const collPath = `sessions/${sessionId}/${role === 'player' ? 'players' : 'centrals'}`
  const node = ref(rtdb, `${collPath}/${id}`)

  // Must land before anything below — rules for players/{id} and centrals/{id}
  // check this ownership map, so an unclaimed id can't be written at all yet.
  await claimOwnership(sessionId, role, id)

  // Read the cap; missing config → no cap to enforce (fail-open, nothing authored).
  const maxField = role === 'player' ? 'maxPlayers' : 'maxCentralScreens'
  const cfg = await get(ref(rtdb, `sessions/${sessionId}/config`))
  const max = (cfg.val()?.[maxField] as number | undefined) ?? Infinity

  const collSnap = await get(ref(rtdb, collPath))
  const reserved = reserveSlot(collSnap.val() as Record<string, Member> | null, id, max)
  if (!reserved) return { ok: false, reason: 'full' }

  // Slot available — write the full presence node. AWAIT the write: callers
  // chain team-join after this, and a fire-and-forget set() would race that
  // update() and clobber player.teamId.
  const base =
    role === 'player'
      ? { connected: true, lastSeen: serverTimestamp(), name: opts.name ?? 'Anon' }
      : { connected: true, lastSeen: serverTimestamp() }

  if (opts.isNew) {
    await set(node, role === 'player' ? { ...base, joinedAt: serverTimestamp() } : base)
  } else {
    await update(node, base)
  }

  onDisconnect(node).update({ connected: false, lastSeen: serverTimestamp() })
  return {
    ok: true,
    leave: () => {
      void update(node, { connected: false, lastSeen: serverTimestamp() })
    },
  }
}
