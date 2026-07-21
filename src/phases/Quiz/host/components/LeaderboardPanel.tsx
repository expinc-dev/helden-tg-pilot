import { useMemo } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { usePlayerNames, useScoresMap } from '../../lib'

export function LeaderboardPanel({ sessionId, phase }: { sessionId: string; phase: Phase }) {
  const scores = useScoresMap(sessionId, phase)
  const playerNames = usePlayerNames(sessionId)
  const sorted = useMemo(() => Object.entries(scores).sort(([, a], [, b]) => b - a), [scores])

  return (
    <div className="rounded-xl border border-white/10 bg-[#181818] p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-[#FFB800]">
        <Icon icon="mdi:trophy" className="size-4" /> Leaderboard
      </h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-white/30">Belum ada skor</p>
      ) : (
        <div className="flex flex-col gap-1">
          {sorted.map(([id, score], i) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.03]"
            >
              <span className="text-white/80">
                <span className="mr-2 font-bold text-[#FFB800]">#{i + 1}</span>
                {playerNames[id] ?? id.slice(0, 8)}
              </span>
              <span className="font-mono font-bold text-[#FFB800]">{score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
