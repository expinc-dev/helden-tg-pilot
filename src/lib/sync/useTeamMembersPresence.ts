import { useEffect, useState } from 'react'

import type { PlayerPresence } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

// Narrow, per-member reads — one listener per known teammate id, never the
// whole players/ tree (that's usePresence, host/central-only; see
// BLUEPRINT_runtime §5 listener scoping). Lets a team leader's own roster
// show name + online status for just their team without a player ever
// subscribing to broad session state.
export function useTeamMembersPresence(
  sessionId: string | undefined,
  memberIds: string[]
): Record<string, PlayerPresence> {
  const key = memberIds.join(',')
  const [members, setMembers] = useState<Record<string, PlayerPresence>>({})

  useEffect(() => {
    if (!sessionId || !key) return
    const ids = key.split(',')
    const offs = ids.map((id) =>
      onValue(eref(`sessions/${sessionId}/players/${id}`), (s) => {
        const v = s.val() as PlayerPresence | null
        setMembers((prev) => {
          if (!v) {
            if (!(id in prev)) return prev
            const next = { ...prev }
            delete next[id]
            return next
          }
          return { ...prev, [id]: v }
        })
      })
    )
    return () => offs.forEach((off) => off())
  }, [sessionId, key])

  return members
}
