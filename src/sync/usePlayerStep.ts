import { useCallback, useEffect, useState } from 'react'

import { onValue, ref, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

// ponytail: selfStep sits on the same players/{id} node as presence. Split into
// a live/ subtree if two sources ever race writes.
export function useMyStep(sessionId: string | undefined, playerId: string) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/players/${playerId}/selfStep`), (s) => {
      setStep(typeof s.val() === 'number' ? s.val() : 0)
    })
  }, [sessionId, playerId])
  const write = useCallback(
    (n: number) =>
      sessionId && update(ref(rtdb, `sessions/${sessionId}/players/${playerId}`), { selfStep: n }),
    [sessionId, playerId]
  )
  return [step, write] as const
}

export type PlayerRow = { id: string; name: string; connected: boolean; selfStep: number }

export function usePlayerBoard(sessionId: string | undefined) {
  const [rows, setRows] = useState<PlayerRow[]>([])
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/players`), (s) => {
      const out: PlayerRow[] = []
      s.forEach((c) => {
        const v = c.val() ?? {}
        out.push({
          id: c.key!,
          name: v.name ?? '?',
          connected: !!v.connected,
          selfStep: v.selfStep ?? 0,
        })
      })
      setRows(out)
    })
  }, [sessionId])
  return rows
}
