import type { Phase } from '@helden-inc/tg-schema'

import { useAnalyzeRoster, useAnalyzeSubmitted } from './status'

// Central view for analyze_grid: title + instruction + bare submitted count.
// Nameless on purpose — per-team rows stay on the host screen; the wall only
// needs "how far along is the room" while the timer runs. (The player writes
// a raw set(), not submitAnswer, so aggregates/answeredCount never moves for
// this template — the answer-node read above is the source of truth.)
export function CentralAnalyzeGrid({
  sessionId,
  phase,
}: {
  sessionId: string
  phase: Phase
  config?: unknown
}) {
  const roster = useAnalyzeRoster(sessionId, phase)
  const submitted = useAnalyzeSubmitted(sessionId, roster, phase.id)
  const done = roster.filter((r) => submitted[r.writerId]).length

  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center text-white">
      <h2 className="text-lg font-semibold">{phase.title}</h2>
      <p className="text-sm text-white/60">Tandai sel yang tetap kosong di perangkatmu.</p>
      <p className="text-xs text-gray-400">
        {done}/{roster.length} sudah mengirim
      </p>
    </div>
  )
}
