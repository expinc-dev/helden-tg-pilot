import { useCallback, useEffect, useState } from 'react'

import type { SyncMode } from '@helden-inc/tg-schema'
import { onValue, ref, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

// Runtime contract hook: reads/writes the RIGHT step node for a phase's syncMode.
// lockstep  -> sessions/{id}/playerSharedStep (one shared step; host is the usual
//              writer, but the hook itself doesn't gate writes — see BLUEPRINT_schema
//              §7, that's a security-rules concern, not a hook concern).
// self_paced -> sessions/{id}/players/{playerId}/selfStep (per-player, unchanged
//              from before this ticket).
// `playerId` is the EFFECTIVE target, not necessarily "me" — team_leader_only
// members pass the team leader's playerId (see useTeamRole + resolveStepTarget in
// teamStep.ts) so they read the leader's step instead of having their own.
// ponytail: selfStep sits on the same players/{id} node as presence. Split into
// a live/ subtree if two sources ever race writes.
export function usePlayerStep(
  sessionId: string | undefined,
  playerId: string | undefined,
  syncMode: SyncMode
) {
  const [step, setStep] = useState(0)

  const path =
    syncMode === 'lockstep'
      ? sessionId
        ? `sessions/${sessionId}/playerSharedStep/step`
        : undefined
      : sessionId && playerId
        ? `sessions/${sessionId}/players/${playerId}/selfStep`
        : undefined

  useEffect(() => {
    if (!path) return
    return onValue(ref(rtdb, path), (s) => {
      setStep(typeof s.val() === 'number' ? s.val() : 0)
    })
  }, [path])

  const write = useCallback(
    (n: number) => {
      if (!sessionId) return
      if (syncMode === 'lockstep') {
        return update(ref(rtdb, `sessions/${sessionId}/playerSharedStep`), { step: n })
      }
      if (!playerId) return
      return update(ref(rtdb, `sessions/${sessionId}/players/${playerId}`), { selfStep: n })
    },
    [sessionId, playerId, syncMode]
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
