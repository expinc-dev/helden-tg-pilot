import { useEffect, useState } from 'react'

import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

import type { SelfieEntry } from './score'

// Live reads of sessions/{id}/selfies. The player uses the single-key hook (to
// know whether their team already has a photo, and to honour retakeAllowed);
// the central screen uses the collection hook to keep the gallery live.

export function useSelfie(sessionId: string | undefined, keyId: string) {
  const [entry, setEntry] = useState<SelfieEntry | null>(null)
  useEffect(() => {
    if (!sessionId || !keyId) return
    return onValue(eref(`sessions/${sessionId}/selfies/${keyId}`), (s) =>
      setEntry((s.val() as SelfieEntry | null) ?? null)
    )
  }, [sessionId, keyId])
  return entry
}

export type SelfieRow = SelfieEntry & { keyId: string }

export function useAllSelfies(sessionId: string | undefined): SelfieRow[] {
  const [rows, setRows] = useState<SelfieRow[]>([])
  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/selfies`), (s) => {
      const val = (s.val() ?? {}) as Record<string, SelfieEntry>
      setRows(
        Object.entries(val)
          .filter(([, e]) => typeof e?.image === 'string' && e.image.startsWith('data:image/'))
          // Stable order: oldest first, so the bento's hero tile is the first
          // team that finished rather than whichever key RTDB happens to sort
          // first (keys are opaque ids — sorting by them is arbitrary).
          .sort((a, b) => (a[1].createdAt ?? 0) - (b[1].createdAt ?? 0))
          .map(([keyId, e]) => ({ ...e, keyId }))
      )
    })
  }, [sessionId])
  return rows
}
