import {
  get,
  onDisconnect,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'

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
// Capacity is enforced atomically by a transaction on the collection BEFORE the
// presence node is written; an N+1 join is rejected with { ok: false, reason: 'full' }.
// ponytail: transaction rewrites the whole players/centrals collection; fine at
// pilot scale (max ~30). Move to a dedicated counter node if a session ever gets large.
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

  const tx = await runTransaction(ref(rtdb, collPath), (members: Record<string, Member> | null) =>
    reserveSlot(members, id, max)
  )
  if (!tx.committed) return { ok: false, reason: 'full' }

  // Slot secured — write the full presence node (overwrites the reserve marker).
  // AWAIT the write: callers chain team-join after this, and a fire-and-forget
  // set() would race that update() and clobber player.teamId.
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
