import { ref, set } from 'firebase/database'
import type { SessionConfig, SessionMeta } from '@helden-inc/tg-schema'
import { rtdb } from '@/lib/firebase'
import { newId, newJoinCode } from '@/lib/ids'

// T-runtime-01 scope: no auth yet, hostUid is a placeholder; no gameVersionId
// resolution yet (bundle loading is T-runtime-02).
// ponytail: retry-on-collision unimplemented; 31^6 ≈ 887M codes, collision is
// astronomically unlikely at pilot scale. Add if we ever hit prod concurrency.
export async function createSession(): Promise<{ sessionId: string; joinCode: string }> {
  const sessionId = newId('sess')
  const joinCode = newJoinCode()
  const now = Date.now()

  const meta: SessionMeta = {
    gameVersionId: 'pilot-demo',
    hostUid: 'anon-host',
    status: 'lobby',
    createdAt: now,
  }
  const config: SessionConfig = { maxPlayers: 30, maxCentralScreens: 3, joinCode }

  await Promise.all([
    set(ref(rtdb, `sessions/${sessionId}/meta`), meta),
    set(ref(rtdb, `sessions/${sessionId}/config`), config),
    set(ref(rtdb, `joinCodes/${joinCode}`), sessionId),
  ])

  return { sessionId, joinCode }
}
