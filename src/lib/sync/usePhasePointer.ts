import { useEffect, useState } from 'react'

import type { PhasePointer } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

export function usePhasePointer(sessionId: string | undefined) {
  const [p, setP] = useState<PhasePointer | null>(null)
  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/phasePointer`), (s) => setP(s.val()))
  }, [sessionId])
  return p
}
