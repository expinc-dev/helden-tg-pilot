import type { Phase } from '@helden-inc/tg-schema'

import { scorePhase } from '@/lib/scoring/score'
import { useTeams } from '@/lib/sync/useTeams'

// Read-only view of every team's progress. Shown to host AND central (anyone
// without a teamId) — the code puzzle itself is played only on player devices.
export function CodeInputMonitor({
  sessionId,
  phase,
  phaseStartMs,
}: {
  sessionId: string
  phase: Phase
  phaseStartMs?: number
}) {
  const phaseId = phase.id
  const teams = useTeams(sessionId)
  const rows = teams
    .map((t) => {
      const st = t.codeinput?.[phaseId]
      const solvedAt = st?.solvedAt
      const elapsedMs = st?.solved && solvedAt && phaseStartMs ? solvedAt - phaseStartMs : 0
      const score = scorePhase(phase, {
        correct: !!st?.solved,
        answered: (st?.attempts ?? 0) > 0,
        elapsedMs,
        phaseDurationMs: (phase.timer?.seconds ?? 0) * 1000,
      })
      return { team: t, st, score }
    })
    .sort((a, b) => b.score - a.score)
  return (
    <div className="flex flex-col gap-2 p-8">
      <p className="text-sm text-gray-500">Team scores</p>
      {rows.length === 0 && <p className="text-sm text-gray-400">No teams yet.</p>}
      {rows.map(({ team, st, score }) => (
        <div
          key={team.id}
          className="flex items-center justify-between rounded border px-3 py-2 text-sm"
        >
          <span>{team.teamName ?? 'Team'}</span>
          <span className="flex items-center gap-3">
            <span className={st?.solved ? 'text-green-600' : 'text-gray-500'}>
              {st?.solved ? 'Solved ✓' : `${st?.attempts ?? 0} attempt(s)`}
            </span>
            <span className="w-16 text-right font-mono tabular-nums">{Math.round(score)} pts</span>
          </span>
        </div>
      ))}
    </div>
  )
}
