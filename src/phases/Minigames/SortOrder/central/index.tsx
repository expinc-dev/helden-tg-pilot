import { useState } from 'react'

import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'

import { TimerRing } from '@/phases/Quiz/TimerRing'

import { usePhasePointer } from '@/lib/sync/usePhasePointer'
import { useTimer } from '@/lib/sync/useTimer'

import { PlayerAnswerRows } from '../components/PlayerAnswerRows'
import {
  isRevealReady,
  previewScore,
  useCumulativeScores,
  useSortOrderAnswers,
  useSortOrderRoster,
} from '../lib'
import type { SortOrderConfig } from '../score'

type ScoreMode = 'game' | 'total'
const GAME_ACCENT = '#2FB8FF'
const TOTAL_ACCENT = '#FFB800'

export function CentralSortOrder({
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
  const totalSec = phase.timer?.seconds ?? 60
  const pointer = usePhasePointer(sessionId)
  const cumulative = useCumulativeScores(sessionId, phase)
  const [mode, setMode] = useState<ScoreMode>('game')

  const ready = isRevealReady(roster, answers, timer.expired)
  // 0 fallback for the brief window before phasePointer has loaded — by the
  // time any answer exists (a prerequisite for `ready`), the phase has
  // already opened and pointer.changedAt is set, so this rarely bites.
  // (Date.now() would be an impure call during render.)
  const phaseStartMs = pointer?.changedAt ?? 0

  const bgStyle = {
    backgroundImage: `url(${assets.images.backgrounds.central})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  // While the clock is still running: full-page "correct order" card, with
  // the compact answer-key readout masked out (asterisks, not blur — easier
  // to read as "hidden" at a glance from across a room than a blur filter).
  // The itemized list below it is fine to show as-is; it's already what the
  // reveal screen shows once the timer ends.
  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-12" style={bgStyle}>
        <div className="w-full max-w-6xl">
          <h2 className="mb-10 text-center text-4xl font-bold text-white">
            Correct Order:{' '}
            <span className="tracking-widest text-white/30 select-none">
              {config.items.map(() => '*').join(' - ')}
            </span>
          </h2>
          <ol className="flex flex-col gap-5">
            {config.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-5 border px-8 py-6 text-2xl text-white"
                style={{ borderRadius: 8, borderColor: '#99A3AE', background: '#1F1F1F' }}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FDDB00] text-lg font-bold text-black">
                  {config.correctOrder.indexOf(item.id) + 1}
                </span>
                <span className="flex-1">{item.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  const values: Record<string, number> =
    mode === 'game'
      ? Object.fromEntries(
          roster.map((r) => [r.key, previewScore(phase, config, phaseStartMs, answers[r.writerId])])
        )
      : Object.fromEntries(roster.map((r) => [r.key, cumulative[r.key] ?? 0]))
  const accent = mode === 'game' ? GAME_ACCENT : TOTAL_ACCENT

  // Once the timer ends: full-page leaderboard, replacing the correct-order
  // card entirely (not shown side by side with it).
  return (
    <div className="fixed inset-0 flex items-start justify-center p-8" style={bgStyle}>
      <div
        className="w-full border bg-black/40 p-6"
        style={{ borderRadius: 8, borderColor: '#353535' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2 rounded-full bg-white/10 p-1">
            <ModeTab
              active={mode === 'game'}
              onClick={() => setMode('game')}
              label="Skor Game Ini"
              color={GAME_ACCENT}
            />
            <ModeTab
              active={mode === 'total'}
              onClick={() => setMode('total')}
              label="Total Kumulatif"
              color={TOTAL_ACCENT}
            />
          </div>
          <TimerRing
            remainingSec={timer.remainingSec}
            totalSec={totalSec}
            expired={timer.expired}
            size={64}
          />
        </div>
        <PlayerAnswerRows
          roster={roster}
          answers={answers}
          config={config}
          values={values}
          accent={accent}
        />
      </div>
    </div>
  )
}

function ModeTab({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  color: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-1.5 text-sm font-semibold transition"
      style={active ? { background: color, color: '#000' } : { color: 'rgba(255,255,255,0.5)' }}
    >
      {label}
    </button>
  )
}
