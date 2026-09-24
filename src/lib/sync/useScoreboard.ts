import { useEffect, useState } from 'react'

import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

// The two boundary-flushed score maps (liveAggregatesSchema in
// @helden-inc/tg-schema). flushPhaseResults writes BOTH on every phase
// boundary — individual phases fill `scores`, team modes fill `teamScores`
// (see lib/session/flush.ts) — so a session that mixed modes ends with entries
// in both. Which map holds the score is therefore never derivable from one
// phase's teamMode: the end phase's teamMode says nothing about the modes of
// the phases that actually produced these numbers.
export type ScoreMap = Record<string, number>

// Two narrow subscriptions, one per score map — never on the whole aggregates/
// node. useAggregate.ts states that contract (BLUEPRINT_runtime §5); the
// session-end board used to subscribe to all of aggregates/ instead.
export function useScoreMaps(sessionId: string | undefined): {
  scores: ScoreMap
  teamScores: ScoreMap
} {
  const [scores, setScores] = useState<ScoreMap>({})
  const [teamScores, setTeamScores] = useState<ScoreMap>({})

  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/aggregates/scores`), (s) =>
      setScores((s.val() as ScoreMap | null) ?? {})
    )
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/aggregates/teamScores`), (s) =>
      setTeamScores((s.val() as ScoreMap | null) ?? {})
    )
  }, [sessionId])

  return { scores, teamScores }
}
export type ScoreRow = { id: string; label: string; score: number }

// Ranked descending. `labels` supplies display names where they are known
// (team names). Ids without an entry fall back to the id itself — which is what
// the session-end board has always shown for players: players/ is a
// host/central read, and the player role renders a board too, so no player-name
// lookup may happen here (BLUEPRINT_runtime §5 listener scoping).
export function rankedRows(scores: ScoreMap, labels: Record<string, string> = {}): ScoreRow[] {
  return Object.entries(scores)
    .map(([id, score]) => ({ id, label: labels[id] ?? id, score }))
    .sort((a, b) => b.score - a.score)
}
