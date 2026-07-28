import { useEffect, useState } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'
import { scorePhase } from '@/lib/scoring/score'

// Live-derive a team's score for a codeinput phase, client-side, from
// teams/{teamId}/codeinput/{phaseId} + phasePointer.changedAt. Uses the SAME
// pure scoring function that flushPhaseResults uses at phase-boundary — so the
// number a player sees during the phase matches what lands in RTDB durable
// results.
//
// ponytail: client-side derivation. When live per-submit score writes ship,
// replace this with useAggregate(sessionId, `teamScores/${teamId}`) reading the
// authoritative live value.

interface CodeInputState {
  attempts?: number
  solved?: boolean
  solvedAt?: number
}

// State + the subscription key it came from. Deps-change → old entry.key !==
// current subKey → render filters it out and shows 0 until onValue fires with
// the new subscription's data. No stale flicker, no synchronous setState in
// effect body (which the react-hooks/set-state-in-effect rule forbids).
interface Entry {
  key: string
  state: CodeInputState | null
}

export function useTeamLiveScore(
  sessionId: string | undefined,
  teamId: string | undefined,
  phase: Phase | null,
  phaseStartMs: number | undefined
): number {
  const active = !!sessionId && !!phase && phase.content.type === 'codeinput'
  const subKey = active ? `${sessionId}/${teamId ?? 'room'}/${phase.id}` : null
  const path = active
    ? teamId
      ? `sessions/${sessionId}/teams/${teamId}/codeinput/${phase.id}`
      : `sessions/${sessionId}/codeinput/${phase.id}`
    : null

  const [entry, setEntry] = useState<Entry | null>(null)

  useEffect(() => {
    if (!subKey || !path) return
    return onValue(ref(rtdb, path), (s) => setEntry({ key: subKey, state: s.val() ?? null }))
  }, [subKey, path])

  if (!phase || !subKey) return 0
  const state = entry && entry.key === subKey ? entry.state : null
  if (!state) return 0
  const solvedAt = state.solvedAt
  const elapsedMs = state.solved && solvedAt && phaseStartMs ? solvedAt - phaseStartMs : 0
  return scorePhase(phase, {
    correct: !!state.solved,
    answered: (state.attempts ?? 0) > 0,
    elapsedMs,
    phaseDurationMs: (phase.timer?.seconds ?? 0) * 1000,
  })
}
