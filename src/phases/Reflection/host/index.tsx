import type { ReflectionContent } from '../lib'
import { useReflectionStats } from '../lib'

// Host's monitor pane — embedded inside the host page's own dark card, so no
// background of its own (matches HostQuiz/LeaderboardPanel). Full per-player
// spread, folded into one pane per the AC.
export function HostReflection({
  content,
  sessionId,
  phaseId,
}: {
  content: ReflectionContent
  sessionId: string
  phaseId: string
}) {
  const { rows, answered, avgScale } = useReflectionStats(sessionId, phaseId)

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
        <StatPill label="Menjawab" value={`${answered.length}/${rows.length}`} />
        <StatPill
          label="Rata-rata skala"
          value={avgScale !== null ? `${avgScale}/${content.scale.max}` : '—'}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {rows.length === 0 && <p className="text-sm text-white/30">Belum ada pemain.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-lg border border-white/10 bg-[#181818] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 truncate text-sm text-white/90">
                <span
                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                    r.connected ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
                {r.name}
              </span>
              {r.answer ? (
                <span className="shrink-0 rounded-full bg-[#FFB800]/10 px-2 py-0.5 text-xs font-bold text-[#FFB800]">
                  {r.answer.scale}/{content.scale.max}
                </span>
              ) : (
                <span className="shrink-0 text-xs text-white/30">Belum menjawab</span>
              )}
            </div>
            {r.answer && <p className="mt-1.5 text-xs text-white/50">{r.answer.text}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 py-1">
      <span className="text-lg font-bold text-[#FFB800]">{value}</span>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  )
}
