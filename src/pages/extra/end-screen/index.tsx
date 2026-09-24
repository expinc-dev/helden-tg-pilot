import { Scoreboard } from '@/phases/End/Scoreboard'

import { useScoreMaps } from '@/lib/sync/useScoreboard'
import { useTeams } from '@/lib/sync/useTeams'

// Rendered when meta.status === 'ended'. Reads the boundary-flushed aggregate
// maps (aggregates/scores + aggregates/teamScores) through the same narrow
// subscriptions the end phase renderer uses, and shows a sorted board. The
// per-phase breakdown lives in sessions/{id}/results/ or /teamResults/, which
// the host dashboard can render if needed.
export function EndScreen({ sessionId }: { sessionId: string }) {
  const { scores, teamScores } = useScoreMaps(sessionId)
  const teams = useTeams(sessionId)

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h2 className="text-2xl font-semibold">Session ended</h2>
        <p className="text-sm text-gray-500">Final scores</p>
      </div>

      <Scoreboard
        scores={scores}
        teamScores={teamScores}
        teamLabels={Object.fromEntries(teams.map((t) => [t.id, t.teamName ?? t.id]))}
        variant="light"
        emptyText="No scored phases in this session."
      />
    </div>
  )
}
