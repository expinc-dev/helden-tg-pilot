import type { MicrolearningContent } from '@helden-inc/tg-schema'

import { usePlayerBoard } from '@/lib/sync/usePlayerStep'

// ─── Central: optional, nameless summary ─────────────────────────────────────
// Public-facing screen — no per-player names, just how far along the room is.
// "Optional" because central isn't part of the required monitoring path (host
// already has HostPresenceSpread); this is a lighter nice-to-have for rooms
// that keep a central screen up during self-paced steps.

export function CentralProgressPane({
  content,
  title,
  sessionId,
}: {
  content: MicrolearningContent
  title: string
  sessionId: string
}) {
  const rows = usePlayerBoard(sessionId)
  const total = content.steps.length
  const doneCounts = rows.map((r) => Math.min(r.selfStep, total - 1) + 1)
  const finished = doneCounts.filter((d) => d === total).length
  const avgPct = rows.length
    ? Math.round((doneCounts.reduce((a, b) => a + b, 0) / (rows.length * total)) * 100)
    : 0

  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="h-3 w-64 overflow-hidden rounded-full bg-gray-200">
        <div className="h-3 rounded-full bg-black transition-all" style={{ width: `${avgPct}%` }} />
      </div>
      <p className="text-xs text-gray-400">
        {finished}/{rows.length} selesai · {avgPct}% rata-rata progres
      </p>
    </div>
  )
}
