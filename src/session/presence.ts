import {
  get,
  onDisconnect,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'

import { rtdb } from '@/lib/firebase'

import { type Member, reserveSlot } from './capacity'

type Role = 'player' | 'central'
export type JoinResult = { ok: true; leave: () => void } | { ok: false; reason: 'full' }

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
