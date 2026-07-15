import { useCallback, useEffect, useState } from 'react'

import { onValue, ref, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

// One shared slide/step index for a phase, driven by whichever role owns
// content.controlledBy (host for presentation, per this ticket) and watched
// by every other role. Mirrors playerSharedStep's lockstep shape but scoped
// to its own node — presentation control isn't a per-player concept.
export function useCentralStep(sessionId: string | undefined) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/centralStep/step`), (s) => {
      setStep(typeof s.val() === 'number' ? s.val() : 0)
    })
  }, [sessionId])

  const write = useCallback(
    (n: number) => {
      if (!sessionId) return
      return update(ref(rtdb, `sessions/${sessionId}/centralStep`), { step: n })
    },
    [sessionId]
  )

  return [step, write] as const
}
