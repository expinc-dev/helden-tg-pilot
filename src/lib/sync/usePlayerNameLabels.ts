import { useEffect, useState } from 'react'

import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

// Display names for a known set of player ids — the label side of useScoreMaps,
// so a score board never has to fall back to a raw p_… id.
//
// One narrow listener per id, never the whole players/ tree: this runs on the
// player role too (the end board renders for every role), and a player
// subscribing to broad session state is what usePresence's contract forbids
// (BLUEPRINT_runtime §5 listener scoping — see useSession.ts and
// useTeamMembersPresence.ts, which this mirrors). The ids come from the score
// map itself, so no name is fetched for a player who has no row.
export function usePlayerNameLabels(
  sessionId: string | undefined,
  playerIds: string[]
): Record<string, string> {
  const key = playerIds.join(',')
  const [labels, setLabels] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!sessionId || !key) return
    const offs = key.split(',').map((id) =>
      onValue(eref(`sessions/${sessionId}/players/${id}/name`), (s) => {
        const name = s.val() as string | null
        setLabels((prev) => {
          if (!name) {
            if (!(id in prev)) return prev
            const next = { ...prev }
            delete next[id]
            return next
          }
          return { ...prev, [id]: name }
        })
      })
    )
    return () => offs.forEach((off) => off())
  }, [sessionId, key])

  return labels
}
