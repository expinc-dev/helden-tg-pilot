import type { Phase } from '@helden-inc/tg-schema'

import { usePhasePointer } from '@/lib/sync/usePhasePointer'
import { useTimer } from '@/lib/sync/useTimer'

import {
  isRevealReady,
  previewScore,
  useCumulativeScores,
  useSortOrderAnswers,
  useSortOrderRoster,
} from '../lib'
import type { SortOrderConfig } from '../score'

// Host's live view: who's still playing, then (once every roster row has
// submitted or the timer expires) each participant's game score alongside
// their running total. Advancing the phase is already handled by the page
// shell's "Tahap Selanjutnya" button (host/lobby) — this only monitors.
export function HostSortOrder({
  sessionId,
  phase,
  config,
}: {
  sessionId: string
  phase: Phase
  config: SortOrderConfig
}) {
  const roster = useSortOrderRoster(sessionId, phase)
  const answers = useSortOrderAnswers(sessionId, roster, phase.id)
  const timer = useTimer(sessionId, phase)
  const pointer = usePhasePointer(sessionId)
  const cumulative = useCumulativeScores(sessionId, phase)

  const ready = isRevealReady(roster, answers, timer.expired)
  // 0 fallback for the brief window before phasePointer has loaded — by the
  // time any answer exists (a prerequisite for `ready`), the phase has
  // already opened and pointer.changedAt is set, so this rarely bites.
  // (Date.now() would be an impure call during render.)
  const phaseStartMs = pointer?.changedAt ?? 0
  const submittedCount = roster.filter((r) => answers[r.writerId]).length

  return (
    <div className="flex flex-col gap-2 p-4">
      <p className="text-sm text-white/50">
        {submittedCount}/{roster.length} sudah mengirim jawaban
      </p>
      {roster.length === 0 && <p className="text-sm text-gray-400">Belum ada peserta.</p>}
      {roster.map((r) => {
        const done = !!answers[r.writerId]
        return (
          <div
            key={r.key}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm"
          >
            <span className="text-white/80">{r.label}</span>
            {ready ? (
              <span className="flex items-center gap-3 font-mono">
                <span className="text-[#2FB8FF]">
                  {Math.round(previewScore(phase, config, phaseStartMs, answers[r.writerId]))} game
                </span>
                <span className="text-[#FFB800]">{Math.round(cumulative[r.key] ?? 0)} total</span>
              </span>
            ) : (
              <span className={done ? 'font-semibold text-green-400' : 'text-white/40'}>
                {done ? 'Terkirim ✓' : 'Menunggu…'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
