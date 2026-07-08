import { useEffect, useState } from 'react'

import type { PhasePointer } from '@helden-inc/tg-schema'
import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

export function usePhasePointer(sessionId: string | undefined) {
  const [p, setP] = useState<PhasePointer | null>(null)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/phasePointer`), (s) => setP(s.val()))
  }, [sessionId])
  return p
}
