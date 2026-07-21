import { useMemo } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { DistributionBars } from '../../host/components/DistributionBars'
import { usePlayerNames, useScoresMap } from '../../lib'

export function RevealOverlay({
  sessionId,
  phaseId,
  questionIndex,
  options,
  phase,
}: {
  sessionId: string
  phaseId: string
  questionIndex: number
  options: { id: string; label: string }[]
  phase: Phase
}) {
  const scores = useScoresMap(sessionId, phase)
  const sorted = useMemo(
    () =>
      Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    [scores]
  )
  const playerNames = usePlayerNames(sessionId)

  return (
    <div className="flex w-full max-w-4xl gap-6">
      <div className="flex-1">
        <DistributionBars
          sessionId={sessionId}
          phaseId={phaseId}
          questionIndex={questionIndex}
          options={options}
          showCorrect
          correctId={undefined}
        />
      </div>

      <div className="w-80 rounded-xl border border-white/10 bg-black/50 p-5 backdrop-blur-sm">
        <h3 className="mb-4 flex items-center justify-center gap-1.5 text-lg font-bold text-[#FFB800]">
          <Icon icon="mdi:trophy" className="size-5" /> Leaderboard
        </h3>
        {sorted.length === 0 ? (
          <p className="text-center text-sm text-white/30">Belum ada skor</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map(([id, score], i) => (
              <div
                key={id}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5"
              >
                <span className="text-white">
                  <span className="mr-2 font-bold text-[#FFB800]">#{i + 1}</span>
                  {playerNames[id] ?? id.slice(0, 8)}
                </span>
                <span className="font-mono font-bold text-[#FFB800]">{score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
