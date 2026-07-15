import { useEffect, useState } from 'react'

import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

// Set of phaseIds that have been played this session. Written by control.ts#
// endLevel to sessions/{id}/played/{phaseId}: true; read by the modular-flow
// picker to disable already-played level cards and by endLevel itself to
// decide when to auto-end the session.
export function usePlayedPhases(sessionId: string | undefined): Record<string, true> {
  const [played, setPlayed] = useState<Record<string, true>>({})
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/played`), (s) => {
      setPlayed((s.val() ?? {}) as Record<string, true>)
    })
  }, [sessionId])
  return played
}
