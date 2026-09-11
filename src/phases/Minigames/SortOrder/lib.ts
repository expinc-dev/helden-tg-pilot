import { useEffect, useState } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'
import { scorePhase } from '@/lib/scoring/score'
import { usePresence } from '@/lib/sync/useSession'
import { useTeams } from '@/lib/sync/useTeams'

import { type SortOrderConfig, scoreSortOrder } from './score'

export function isTeamMode(phase: Phase): boolean {
  return phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
}

// One row per scoreable unit: a team in team modes (team_leader_only /
// team_collaborative — sort_order only lets the leader play in either mode,
// see SortOrder/index.tsx), or a player in individual sessions. `writerId` is
// whose players/{id}/answers/{phaseId} node actually holds the submission —
// same as `key` for individual, the team's leader for team modes.
export type SortOrderParticipant = { key: string; writerId: string; label: string }

export function useSortOrderRoster(
  sessionId: string | undefined,
  phase: Phase
): SortOrderParticipant[] {
  const teams = useTeams(sessionId)
  const { players } = usePresence(sessionId)
  if (isTeamMode(phase)) {
    return teams.map((t) => ({ key: t.id, writerId: t.ownerPlayerId, label: t.teamName ?? t.id }))
  }
  return Object.entries(players).map(([id, p]) => ({ key: id, writerId: id, label: p.name }))
}

export type SortOrderAnswer = { value: string[]; submittedAt?: number }

// Which round of a multi-round sort_order phase is currently active
// (BRIGHT-966). Reads sessions/{id}/roundState/{phaseId}, seeded by the host
// on phase-open (see control.ts#openPhaseRoundState) and bumped by
// advanceRound(). Defaults to round 1 when the node is absent, so a legacy
// sort_order config (no `rounds` authored) or a phase that hasn't opened yet
// behaves exactly as before this feature existed.
export function useRoundState(sessionId: string | undefined, phaseId: string): { round: number } {
  const [round, setRound] = useState(1)
  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/roundState/${phaseId}`), (s) => {
      const v = s.val() as { round?: number } | null
      setRound(v?.round ?? 1)
    })
  }, [sessionId, phaseId])
  return { round }
}

// Narrow per-participant read: only the writer's own answers/{phaseId}/rounds/{round}
// node, not players/* broadly — one listener per roster row. Round-scoped
// (BRIGHT-966) so each round's submission lives at its own path instead of
// overwriting a single flat answers/{phaseId} node; round 1 of a legacy
// (non-multi-round) config reads/writes the exact same data it always has,
// just one path segment deeper.
export function useSortOrderAnswers(
  sessionId: string | undefined,
  roster: SortOrderParticipant[],
  phaseId: string,
  round: number
): Record<string, SortOrderAnswer | undefined> {
  const [answers, setAnswers] = useState<Record<string, SortOrderAnswer | undefined>>({})
  const writerKey = roster.map((r) => r.writerId).join(',')

  useEffect(() => {
    if (!sessionId) return
    const unsubs = roster.map((r) =>
      onValue(
        eref(`sessions/${sessionId}/players/${r.writerId}/answers/${phaseId}/rounds/${round}`),
        (s) => {
          const v = s.val()
          setAnswers((prev) => ({
            ...prev,
            [r.writerId]:
              v && Array.isArray(v.value)
                ? { value: v.value, submittedAt: v.submittedAt }
                : undefined,
          }))
        }
      )
    )
    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, writerKey, phaseId, round])

  return answers
}

// Cumulative total-so-far map (prior phases only — THIS phase's flush hasn't
// run yet while it's still active). Same store/shape Quiz's leaderboard reads:
// sessions/{id}/aggregates/scores or /teamScores depending on team mode.
export function useCumulativeScores(
  sessionId: string | undefined,
  phase: Phase
): Record<string, number> {
  const path = isTeamMode(phase) ? 'teamScores' : 'scores'
  const [scores, setScores] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/aggregates/${path}`), (s) => {
      setScores((s.val() as Record<string, number>) ?? {})
    })
  }, [sessionId, path])
  return scores
}

// Live "this game" score preview — pure client computation using the SAME
// scorer + scorePhase math flush.ts runs at phase-end, so the number shown
// during reveal matches what actually gets persisted once the host advances.
export function previewScore(
  phase: Phase,
  config: SortOrderConfig,
  phaseStartMs: number,
  answer: SortOrderAnswer | undefined
): number {
  const signal = scoreSortOrder({
    config,
    answer: answer?.value,
    answerSubmittedAt: answer?.submittedAt,
    phaseStartMs,
  })
  return scorePhase(phase, {
    correct: signal.correct,
    answered: signal.answered,
    elapsedMs: signal.elapsedMs,
    phaseDurationMs: (phase.timer?.seconds ?? 0) * 1000,
  })
}

// Reveal gate — wait for the phase timer to run out, full stop. Previously
// this also revealed early once every roster row had submitted, but with a
// roster of 1 (solo play/testing) that made it fire the instant the lone
// player submitted, well before the clock ran out.
export function isRevealReady(
  roster: SortOrderParticipant[],
  answers: Record<string, SortOrderAnswer | undefined>,
  timerExpired: boolean
): boolean {
  return timerExpired
}
