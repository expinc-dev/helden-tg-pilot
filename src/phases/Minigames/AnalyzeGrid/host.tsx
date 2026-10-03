import { HostPanelHeader } from '@/pages/host/_shared/HostScreenFrame'
import { ProgressRow, SubmittedStrip, TeamLabel } from '@/pages/host/_shared/ProgressRow'
import type { Phase } from '@helden-inc/tg-schema'

import { useGameType } from '@/lib/sync/useGameType'

import type { AnalyzeGridConfig } from './score'
import { useAnalyzeRoster, useAnalyzeSubmitted } from './status'

// Host view for analyze_grid: per-team/per-player submit spread plus the
// answer key. Previously this role rendered null, so the host live shell
// showed only title + generic controls and the room's progress was invisible.
export function HostAnalyzeGrid({
  sessionId,
  phase,
  config,
}: {
  sessionId: string
  phase: Phase
  config: AnalyzeGridConfig
}) {
  const roster = useAnalyzeRoster(sessionId, phase)
  const submitted = useAnalyzeSubmitted(sessionId, roster, phase.id)
  const done = roster.filter((r) => submitted[r.writerId]).length
  const gameType = useGameType()

  return (
    <div className="flex min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#353535_transparent] flex-col gap-16 overflow-y-auto px-8 pt-10 pb-8">
      <HostPanelHeader
        badge={gameType}
        title="Progres Tim"
        subtitle="Pantau seluruh progress pemain secara real-time"
      />

      <div className="flex flex-col gap-4">
        <SubmittedStrip done={done} total={roster.length} tone="dark" />
        {roster.length === 0 ? (
          <p className="px-1 text-sm text-white/50">Belum ada pemain aktif.</p>
        ) : (
          roster.map((r) => (
            <ProgressRow key={r.key} pct={submitted[r.writerId] ? 100 : 0}>
              <TeamLabel name={r.label} />
            </ProgressRow>
          ))
        )}

        <details className="rounded-lg border border-[#353535] px-4 py-3">
          <summary className="cursor-pointer text-xs text-white/60">
            Kunci jawaban (untuk host)
          </summary>
          <p className="mt-2 text-sm text-[#FFB800]">
            {config.emptyCells.map((c) => `${c.row}–${c.col}`).join(' · ')}
          </p>
        </details>
      </div>
    </div>
  )
}
