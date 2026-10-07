import { useCallback, useEffect, useState } from 'react'

import type { SyncMode } from '@helden-inc/tg-schema'
import { onValue, update } from 'firebase/database'

import { eref } from '@/lib/firebase'

// Runtime contract hook: reads/writes the RIGHT step node for a phase's syncMode.
// lockstep  -> sessions/{id}/playerSharedStep (one shared step; host is the usual
//              writer, but the hook itself doesn't gate writes — see BLUEPRINT_schema
//              §7, that's a security-rules concern, not a hook concern).
// self_paced -> sessions/{id}/players/{playerId}/selfStep (per-player per-phase: selfStep/{phaseId}, unchanged
//              from before this ticket).
// `playerId` is the EFFECTIVE target, not necessarily "me" — team_leader_only
// members pass the team leader's playerId (see useTeamRole + resolveStepTarget in
// teamStep.ts) so they read the leader's step instead of having their own.
// ponytail: selfStep sits on the same players/{id} node as presence. Split into
// a live/ subtree if two sources ever race writes.
// selfStep is stored per phase (players/{id}/selfStep/{phaseId}) so progress and
// "done" marks from one phase never bleed into another. A legacy bare number
// (pre-per-phase data) is ignored rather than reinterpreted.
export function readSelfStep(raw: unknown, phaseId: string): number {
  if (raw && typeof raw === 'object') {
    const v = (raw as Record<string, unknown>)[phaseId]
    return typeof v === 'number' ? v : 0
  }
  return 0
}

export function usePlayerStep(
  sessionId: string | undefined,
  playerId: string | undefined,
  syncMode: SyncMode,
  phaseId: string
) {
  const [step, setStep] = useState(0)
  // The path `step` was last actually read from. `step` starts at 0 before RTDB
  // answers, which looks identical to "the player is on step 0" — a caller that
  // ACTS on the step (rather than just rendering it) needs to know the read landed,
  // or a refreshing player at step 3 would briefly be treated as step 0.
  const [loadedPath, setLoadedPath] = useState<string | undefined>(undefined)

  const path =
    syncMode === 'lockstep'
      ? sessionId
        ? `sessions/${sessionId}/playerSharedStep/step`
        : undefined
      : sessionId && playerId
        ? `sessions/${sessionId}/players/${playerId}/selfStep/${phaseId}`
        : undefined

  useEffect(() => {
    if (!path) return
    return onValue(eref(path), (s) => {
      setStep(typeof s.val() === 'number' ? s.val() : 0)
      setLoadedPath(path)
    })
  }, [path])

  const write = useCallback(
    (n: number) => {
      if (!sessionId) return
      if (syncMode === 'lockstep') {
        return update(eref(`sessions/${sessionId}/playerSharedStep`), { step: n })
      }
      if (!playerId) return
      return update(eref(`sessions/${sessionId}/players/${playerId}`), {
        [`selfStep/${phaseId}`]: n,
      })
    },
    [sessionId, playerId, syncMode, phaseId]
  )
  // Third element is additive: existing `[step, write]` destructuring is unaffected.
  return [step, write, !!path && loadedPath === path] as const
}

export type PlayerRow = { id: string; name: string; connected: boolean; selfStep: number }

export function usePlayerBoard(sessionId: string | undefined, phaseId: string) {
  const [rows, setRows] = useState<PlayerRow[]>([])
  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/players`), (s) => {
      const out: PlayerRow[] = []
      s.forEach((c) => {
        const v = c.val() ?? {}
        out.push({
          id: c.key!,
          name: v.name ?? '?',
          connected: !!v.connected,
          selfStep: readSelfStep(v.selfStep, phaseId),
        })
      })
      setRows(out)
    })
  }, [sessionId, phaseId])
  return rows
}
