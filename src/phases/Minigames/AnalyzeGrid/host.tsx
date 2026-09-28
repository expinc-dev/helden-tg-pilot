import type { Phase } from '@helden-inc/tg-schema'

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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{phase.title}</h2>
        <p className="mt-1 text-xs text-white/40">
          Tandai sel yang tetap kosong &middot; {done}/{roster.length} sudah mengirim
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {roster.length === 0 ? (
          <p className="px-1 text-xs text-white/50">Belum ada pemain aktif.</p>
        ) : (
          roster.map((r) => (
            <div
              key={r.key}
              className="flex w-full items-center justify-between rounded-lg border px-4 py-3"
              style={{ borderColor: '#353535', background: 'rgba(0, 0, 0, 0.64)' }}
            >
              <span className="text-sm text-white/90">{r.label}</span>
              <span
                className={`text-xs font-semibold ${
                  submitted[r.writerId] ? 'text-[#22C55E]' : 'text-white/40'
                }`}
              >
                {submitted[r.writerId] ? 'Terkirim \u2713' : 'Menunggu\u2026'}
              </span>
            </div>
          ))
        )}
      </div>

      <details className="rounded-lg border px-4 py-3" style={{ borderColor: '#353535' }}>
        <summary className="cursor-pointer text-xs text-white/60">
          Kunci jawaban (untuk host)
        </summary>
        <p className="mt-2 text-sm text-[#FFB800]">
          {config.emptyCells.map((c) => `${c.row}\u2013${c.col}`).join(' \u00b7 ')}
        </p>
      </details>
    </div>
  )
}
