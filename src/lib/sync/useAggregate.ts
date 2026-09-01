import { useEffect, useState } from 'react'

import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

// Runtime contract hook (BLUEPRINT_runtime §5): one numeric aggregate value,
// narrowly scoped to exactly the path given — never subscribe to the whole
// aggregates/ node. `path` is relative to sessions/{id}/aggregates/, e.g.
// "answeredCount/q0", "scores/{playerId}", "teamScores/{teamId}" (see
// liveAggregatesSchema in @helden-inc/tg-schema).
export function useAggregate(sessionId: string | undefined, path: string): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/aggregates/${path}`), (s) => {
      setValue(typeof s.val() === 'number' ? s.val() : 0)
    })
  }, [sessionId, path])
  return value
}
