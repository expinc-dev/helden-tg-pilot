import { onDisconnect, ref, serverTimestamp, set, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

type Role = 'player' | 'central'

// Caller owns a stable id (from localStorage) so refresh reuses the same RTDB node.
// isNew=true → first join, establish node + joinedAt. isNew=false → rejoin, merge
// presence fields only so selfStep/joinedAt survive (BLUEPRINT_runtime §7).
export function joinPresence(
  sessionId: string,
  role: Role,
  id: string,
  opts: { isNew: boolean; name?: string }
) {
  const path = `sessions/${sessionId}/${role === 'player' ? 'players' : 'centrals'}/${id}`
  const node = ref(rtdb, path)

  const base =
    role === 'player'
      ? { connected: true, lastSeen: serverTimestamp(), name: opts.name ?? 'Anon' }
      : { connected: true, lastSeen: serverTimestamp() }

  if (opts.isNew) {
    set(node, role === 'player' ? { ...base, joinedAt: serverTimestamp() } : base)
  } else {
    update(node, base)
  }

  onDisconnect(node).update({ connected: false, lastSeen: serverTimestamp() })
  return () => update(node, { connected: false, lastSeen: serverTimestamp() })
}
