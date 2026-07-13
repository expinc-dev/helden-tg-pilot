import { useEffect, useState } from 'react'

import type { Team } from '@helden-inc/tg-schema'
import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

export type TeamRow = Team & { id: string; memberCount: number }

// Teams keyed by id. Roster size is the authoritative memberIds key count
// (owner included) — the same count the maxMembers transaction enforces.
export function useTeams(sessionId: string | undefined): TeamRow[] {
  const [teams, setTeams] = useState<Record<string, Team>>({})

  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/teams`), (s) => setTeams(s.val() ?? {}))
  }, [sessionId])

  return Object.entries(teams).map(([id, t]) => ({
    ...t,
    id,
    memberCount: Object.keys(t.memberIds ?? {}).length,
  }))
}

export function useMyTeamId(sessionId: string | undefined, playerId: string): string | undefined {
  const [teamId, setTeamId] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/players/${playerId}/teamId`), (s) =>
      setTeamId(s.val() ?? undefined)
    )
  }, [sessionId, playerId])
  return teamId
}
