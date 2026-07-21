import { useEffect, useState } from 'react'

import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'
import type { TeamRow } from '@/lib/sync/useTeams'

// Per-team submission status for a minigame phase. sort_order (like other
// team_leader_only templates) writes the leader's answer to
// players/{ownerPlayerId}/answers/{phaseId} — not embedded on the team node —
// so host/central watch that path per team rather than reading team.* directly.
// Keyed on a stable owner-id string (not the `teams` array reference, which
// useTeams recreates every render) so listeners don't churn on every re-render.
export function useTeamSubmissions(
  sessionId: string | undefined,
  teams: TeamRow[],
  phaseId: string
): Record<string, boolean> {
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const ownerKey = teams.map((t) => `${t.id}:${t.ownerPlayerId}`).join(',')

  useEffect(() => {
    if (!sessionId) return
    const unsubs = teams.map((team) =>
      onValue(
        ref(rtdb, `sessions/${sessionId}/players/${team.ownerPlayerId}/answers/${phaseId}`),
        (s) => setSubmitted((prev) => ({ ...prev, [team.id]: !!s.val() }))
      )
    )
    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, ownerKey, phaseId])

  return submitted
}
