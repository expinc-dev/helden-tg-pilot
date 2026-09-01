import { useEffect, useState } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

import { useMyTeamId } from './useTeams'

export type TeamRole = 'solo' | 'leader' | 'member'

// Narrow read: just THIS team's owner, not the whole team roster (that's
// useTeams, which every player calling useTeamRole must not end up subscribing
// to — see BLUEPRINT_runtime §5 listener scoping).
export function useTeamOwner(sessionId: string | undefined, teamId: string | undefined) {
  const [ownerPlayerId, setOwnerPlayerId] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!sessionId || !teamId) return
    return onValue(eref(`sessions/${sessionId}/teams/${teamId}/ownerPlayerId`), (s) =>
      setOwnerPlayerId(s.val() ?? undefined)
    )
  }, [sessionId, teamId])
  return ownerPlayerId
}

// The ONE place every renderer resolves team role for the active phase — do not
// re-derive solo/leader/member per phase. "solo" whenever the phase's teamMode
// is absent/"individual", or the player isn't (yet) on a team, so team-unaware
// renderers keep working exactly as before Team Mode existed.
// "leader" = the team's existing ownerPlayerId (no separate leader concept).
export function useTeamRole(
  sessionId: string | undefined,
  playerId: string | undefined,
  phase: Phase | null | undefined
): TeamRole {
  const teamId = useMyTeamId(sessionId, playerId ?? '')
  const ownerPlayerId = useTeamOwner(sessionId, teamId)

  const teamModeOn =
    phase?.teamMode === 'team_leader_only' || phase?.teamMode === 'team_collaborative'
  if (!teamModeOn || !teamId) return 'solo'
  return ownerPlayerId === playerId ? 'leader' : 'member'
}
