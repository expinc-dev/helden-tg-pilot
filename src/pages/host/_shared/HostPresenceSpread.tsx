import type { Phase, PlayerPresence } from '@helden-inc/tg-schema'

import { usePlayerBoard } from '@/lib/sync/usePlayerStep'

// Per-player progress spread. Only meaningful for self_paced phases — players
// advance independently and the host wants to see who's where. Reuses the
// presence row shape used by Host – Lobby (name + connected dot), extended
// with the player's selfStep.
export function HostPresenceSpread({
  sessionId,
  phase,
  players,
}: {
  sessionId: string | undefined
  phase: Phase
  players: Record<string, PlayerPresence>
}) {
  const rows = usePlayerBoard(sessionId)
  // Reflection and CodePiece have no step concept (single screen, own
  // dedicated host pane already shows per-player state) — a step-based
  // spread would just show a meaningless "Langkah 1" for everyone.
  if (
    phase.syncMode !== 'self_paced' ||
    phase.content.type === 'reflection' ||
    phase.content.type === 'codepiece'
  )
    return null

  const totalSteps = phase.content.type === 'microlearning' ? phase.content.steps.length : undefined

  return (
    <div className="rounded-2xl border border-white/5 bg-[#121212] p-4 sm:p-6">
      <div className="mb-3 rounded-lg bg-[#1C1C1E] px-4 py-2 text-sm font-semibold text-[#FFB800] sm:text-base">
        Progres Pemain
      </div>
      <ul className="flex flex-col gap-1">
        {rows.length === 0 ? (
          <li className="px-1 text-xs text-white/50">Belum ada pemain aktif.</li>
        ) : (
          rows.map((r) => {
            const name = players[r.id]?.name ?? r.name
            const label =
              totalSteps !== undefined
                ? `Langkah ${Math.min(r.selfStep + 1, totalSteps)}/${totalSteps}`
                : `Langkah ${r.selfStep + 1}`
            return (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-md bg-[#1C1C1E] px-3 py-2 text-sm text-white/90"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      r.connected ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  />
                  {name}
                </span>
                <span className="text-xs text-white/60">{label}</span>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
