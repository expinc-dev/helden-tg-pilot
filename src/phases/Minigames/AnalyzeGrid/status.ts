import { useEffect, useState } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'
import { usePresence } from '@/lib/sync/useSession'
import { useTeams } from '@/lib/sync/useTeams'

export type AnalyzeParticipant = { key: string; writerId: string; label: string }

// One row per scoreable unit: a team in team modes (only the leader plays —
// see AnalyzeGrid/index.tsx), or a player in individual sessions. Mirrors
// sort_order's roster so the host spread reads the same in both challenge
// phases.
export function useAnalyzeRoster(
  sessionId: string | undefined,
  phase: Phase
): AnalyzeParticipant[] {
  const teams = useTeams(sessionId)
  const { players } = usePresence(sessionId)
  const teamMode = phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  // Single Player sessions have no teams even when the phase is authored for
  // team mode — fall back to the players so the host/central spread is not empty.
  if (teamMode && teams.length > 0) {
    return teams.map((t) => ({ key: t.id, writerId: t.ownerPlayerId, label: t.teamName ?? t.id }))
  }
  return Object.entries(players).map(([id, p]) => ({ key: id, writerId: id, label: p.name }))
}

// Submitted-or-not per writer, read off players/{writerId}/answers/{phaseId}.
// The player writes a raw set() (not submitAnswer), so aggregates/
// answeredCount never moves for this template — read the answer nodes
// directly instead.
export function useAnalyzeSubmitted(
  sessionId: string | undefined,
  roster: AnalyzeParticipant[],
  phaseId: string
): Record<string, boolean> {
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const writerKey = roster.map((r) => r.writerId).join(',')

  useEffect(() => {
    if (!sessionId) return
    // Fresh roster (e.g. phase just opened): reconcile inside the subscription
    // callbacks only, so a key the new roster dropped keeps its last value
    // instead of flashing back to "Menunggu".
    const unsubs = roster.map((r) =>
      onValue(eref(`sessions/${sessionId}/players/${r.writerId}/answers/${phaseId}`), (s) => {
        setSubmitted((prev) => ({ ...prev, [r.writerId]: s.val() != null }))
      })
    )
    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, writerKey, phaseId])

  return submitted
}
