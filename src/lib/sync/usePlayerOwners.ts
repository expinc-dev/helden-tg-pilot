import { useEffect, useState } from 'react'

import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

// Who has claimed a player seat in this session (HLN-003).
//
// `playerOwners` is the one participant list a player's own client may read:
// presence (`players/`) is host/central-only by contract, and it carries names
// — exactly what the anonymous gallery must never touch. This node holds ids
// only, is written by claimOwnership at join time, and is never pruned, so its
// keys are the session's full set of players.
//
// Whole-node read on purpose: the phone needs every seat in order to label
// "Tim A/B/C" positionally, the node is a flat uid map, and one listener is
// both the cheapest and the simplest shape.
export function usePlayerOwners(sessionId: string | undefined): Record<string, string> {
  const [owners, setOwners] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/playerOwners`), (s) => {
      setOwners((s.val() as Record<string, string> | null) ?? {})
    })
  }, [sessionId])

  return owners
}
