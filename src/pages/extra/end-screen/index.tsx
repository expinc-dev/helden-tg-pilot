import { useEffect, useState } from 'react'

import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'
import { useTeams } from '@/lib/sync/useTeams'

// Rendered when meta.status === 'ended'. Reads the boundary-flushed aggregate
// maps (aggregates/scores + aggregates/teamScores) and shows a sorted board.
// ponytail: no per-phase breakdown yet — that lives in sessions/{id}/results/
// or /teamResults/, which the host dashboard can render if needed.

interface Aggregates {
  scores?: Record<string, number>
  teamScores?: Record<string, number>
}

function useAggregates(sessionId: string | undefined): Aggregates {
  const [agg, setAgg] = useState<Aggregates>({})
  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/aggregates`), (s) => setAgg(s.val() ?? {}))
  }, [sessionId])
  return agg
}

export function EndScreen({ sessionId }: { sessionId: string }) {
  const agg = useAggregates(sessionId)
  const teams = useTeams(sessionId)
  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.teamName ?? t.id]))

  const teamRows = Object.entries(agg.teamScores ?? {})
    .map(([teamId, score]) => ({ id: teamId, name: teamNameById[teamId] ?? teamId, score }))
    .sort((a, b) => b.score - a.score)
  const playerRows = Object.entries(agg.scores ?? {})
    .map(([playerId, score]) => ({ id: playerId, score }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h2 className="text-2xl font-semibold">Session ended</h2>
        <p className="text-sm text-gray-500">Final scores</p>
      </div>

      {teamRows.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs tracking-wide text-gray-500 uppercase">Teams</p>
          {teamRows.map((r, i) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded border px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-right text-gray-400">{i + 1}.</span>
                <span>{r.name}</span>
              </span>
              <span className="font-mono tabular-nums">{Math.round(r.score)} pts</span>
            </div>
          ))}
        </section>
      )}

      {playerRows.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs tracking-wide text-gray-500 uppercase">Players</p>
          {playerRows.map((r, i) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded border px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-right text-gray-400">{i + 1}.</span>
                <span className="font-mono text-xs">{r.id}</span>
              </span>
              <span className="font-mono tabular-nums">{Math.round(r.score)} pts</span>
            </div>
          ))}
        </section>
      )}

      {teamRows.length === 0 && playerRows.length === 0 && (
        <p className="text-sm text-gray-400">No scored phases in this session.</p>
      )}
    </div>
  )
}
