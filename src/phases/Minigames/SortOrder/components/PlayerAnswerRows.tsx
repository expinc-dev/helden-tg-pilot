import { type SortOrderAnswer, type SortOrderParticipant } from '../lib'
import type { SortOrderConfig } from '../score'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Shared row list (rank, avatar initials, name, per-position correctness bar,
// score) used by both central's full-bleed leaderboard and the host's
// floating PlayerAnswersPanel — same data, two different chrome wrappers.
export function PlayerAnswerRows({
  roster,
  answers,
  config,
  values,
  accent,
}: {
  roster: SortOrderParticipant[]
  answers: Record<string, SortOrderAnswer | undefined>
  config: SortOrderConfig
  values: Record<string, number>
  accent: string
}) {
  const sorted = [...roster].sort((a, b) => (values[b.key] ?? 0) - (values[a.key] ?? 0))
  if (sorted.length === 0) {
    return <p className="text-center text-sm text-white/30">Belum ada data.</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {sorted.map((r, i) => {
        const submitted = answers[r.writerId]?.value
        return (
          <div key={r.key} className="flex items-center gap-4 rounded-lg bg-white/5 px-4 py-2.5">
            <span className="w-6 text-white/50">{i + 1}.</span>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
              {initials(r.label)}
            </div>
            <span className="w-36 shrink-0 truncate text-white">{r.label}</span>
            <div className="flex flex-1 gap-1">
              {config.correctOrder.map((id, pos) => (
                <span
                  key={pos}
                  className="h-2.5 flex-1 rounded"
                  style={{ background: submitted?.[pos] === id ? '#51CE92' : '#E4456D' }}
                />
              ))}
            </div>
            <span
              className="w-16 shrink-0 text-right font-mono font-bold"
              style={{ color: accent }}
            >
              {Math.round(values[r.key] ?? 0)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
