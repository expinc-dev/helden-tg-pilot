import { Scoreboard } from '@/phases/End/Scoreboard'

import { useScoreMaps } from '@/lib/sync/useScoreboard'

// Rendered when meta.status === 'ended'. Reads the boundary-flushed aggregate
// maps (aggregates/scores + aggregates/teamScores) through the same narrow
// subscriptions the end phase renderer uses, and shows a sorted board. The
// per-phase breakdown lives in sessions/{id}/results/ or /teamResults/, which
// the host dashboard can render if needed.
export function EndScreen({ sessionId }: { sessionId: string }) {
  const { scores, teamScores } = useScoreMaps(sessionId)

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h2 className="text-2xl font-semibold">Sesi berakhir</h2>
        <p className="text-sm text-gray-500">Skor akhir</p>
      </div>

      <Scoreboard
        sessionId={sessionId}
        scores={scores}
        teamScores={teamScores}
        variant="light"
        emptyText="Belum ada fase berpoin di sesi ini."
      />
    </div>
  )
}
