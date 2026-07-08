import { onDisconnect, ref, serverTimestamp, set, update } from 'firebase/database'
import { rtdb } from '@/lib/firebase'

type Role = 'player' | 'central'

// Caller owns the id (via useState initializer) so React StrictMode double-mount
// reuses the same RTDB node instead of leaving a "connected:false" ghost per remount.
export function joinPresence(sessionId: string, role: Role, id: string, name?: string) {
  const path = `sessions/${sessionId}/${role === 'player' ? 'players' : 'centrals'}/${id}`
  const node = ref(rtdb, path)

  const payload =
    role === 'player'
      ? { name: name ?? 'Anon', connected: true, lastSeen: serverTimestamp(), joinedAt: serverTimestamp() }
      : { connected: true, lastSeen: serverTimestamp() }

  set(node, payload)
  onDisconnect(node).update({ connected: false, lastSeen: serverTimestamp() })

  return () => update(node, { connected: false, lastSeen: serverTimestamp() })
}
