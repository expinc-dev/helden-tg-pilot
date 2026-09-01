import type { SessionConfig, SessionMeta } from '@helden-inc/tg-schema'
import { set } from 'firebase/database'

import { demoBundle } from '@/lib/demoBundle'
import { auth, eref } from '@/lib/firebase'
import { newId, newJoinCode } from '@/lib/ids'

// hostUid is now the REAL auth.uid of whoever creates the session — App.tsx
// gates all routes on auth resolving first, so auth.currentUser is always
// populated by the time this runs. database.rules.json checks phasePointer/
// timer/meta.status writes against this exact field; a placeholder here would
// make every host-only rule unenforceable (equivalent to no rule at all).
// ponytail: retry-on-collision unimplemented; 31^6 ≈ 887M codes, collision is
// astronomically unlikely at pilot scale. Add if we ever hit prod concurrency.
export async function createSession(
  opts: {
    name?: string
    maxPlayers?: number
    maxCentralScreens?: number
    allowTeams?: boolean
    maxMembers?: number
  } = {}
): Promise<{ sessionId: string; joinCode: string }> {
  const hostUid = auth.currentUser?.uid
  if (!hostUid) throw new Error('createSession called before anonymous sign-in resolved')

  const sessionId = newId('sess')
  const joinCode = newJoinCode()
  const now = Date.now()

  const trimmedName = opts.name?.trim()
  const meta: SessionMeta = {
    // Real identity from the pasted bundle — this deploy plays exactly this game.
    // gameId is the eventId (games/{eventId}); paths are already event-scoped via eref.
    gameVersionId: demoBundle.id,
    hostUid,
    status: 'lobby',
    createdAt: now,
    ...(trimmedName ? { name: trimmedName } : {}),
  }
  const config: SessionConfig = {
    maxPlayers: opts.maxPlayers && opts.maxPlayers > 0 ? opts.maxPlayers : 30,
    maxCentralScreens:
      opts.maxCentralScreens && opts.maxCentralScreens > 0 ? opts.maxCentralScreens : 3,
    joinCode,
    ...(opts.allowTeams ? { allowTeams: true } : {}),
    ...(opts.maxMembers ? { maxMembers: opts.maxMembers } : {}),
  }

  await Promise.all([
    set(eref(`sessions/${sessionId}/meta`), meta),
    set(eref(`sessions/${sessionId}/config`), config),
    set(eref(`joinCodes/${joinCode}`), sessionId),
  ])

  return { sessionId, joinCode }
}
