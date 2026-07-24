import { useState } from 'react'

import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { usePhasePointer } from '@/lib/sync/usePhasePointer'
import { useTimer } from '@/lib/sync/useTimer'

import {
  type SortOrderParticipant,
  isRevealReady,
  isTeamMode,
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
  const pointer = usePhasePointer(sessionId)
  const cumulative = useCumulativeScores(sessionId, phase)
  const [mode, setMode] = useState<ScoreMode>('game')

  const submittedCount = roster.filter((r) => answers[r.writerId]).length
  const ready = isRevealReady(roster, answers, timer.expired)
  // 0 fallback for the brief window before phasePointer has loaded — by the
  // time any answer exists (a prerequisite for `ready`), the phase has
  // already opened and pointer.changedAt is set, so this rarely bites.
  // (Date.now() would be an impure call during render.)
  const phaseStartMs = pointer?.changedAt ?? 0
  const unitLabel = isTeamMode(phase) ? 'tim' : 'pemain'

  const bgStyle = {
    backgroundImage: `url(${assets.images.backgrounds.central})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  if (!ready) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-8 p-8"
        style={bgStyle}
      >
        <Icon icon="mdi:sort" className="size-16 text-[#FFB800]" />
        <h1 className="max-w-4xl text-center text-4xl leading-tight font-bold text-white drop-shadow-lg">
          {phase.title}
        </h1>
        <p className="text-xl text-white/50">Setiap {unitLabel} menyusun urutannya sendiri...</p>
        <div className="rounded-full bg-white/10 px-6 py-2 text-2xl font-bold text-[#FFB800]">
          {submittedCount} / {roster.length} selesai
        </div>
      </div>
    )
  }

  const idToLabel = Object.fromEntries(config.items.map((i) => [i.id, i.label]))
  const values: Record<string, number> =
    mode === 'game'
      ? Object.fromEntries(
          roster.map((r) => [r.key, previewScore(phase, config, phaseStartMs, answers[r.writerId])])
        )
      : Object.fromEntries(roster.map((r) => [r.key, cumulative[r.key] ?? 0]))
  const accent = mode === 'game' ? GAME_ACCENT : TOTAL_ACCENT

  return (
    <div
      className="fixed inset-0 flex flex-col items-center gap-6 overflow-y-auto p-8"
      style={bgStyle}
    >
      <h1 className="text-center text-3xl font-bold text-white drop-shadow-lg">{phase.title}</h1>
      <p className="text-white/50">Urutan yang benar</p>

      <ol className="flex w-full max-w-md flex-col gap-2">
        {config.correctOrder.map((id, i) => (
          <li
            key={id}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#26890C] text-xs font-bold text-white">
              {i + 1}
            </span>
            {idToLabel[id] ?? id}
          </li>
        ))}
      </ol>

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

      <ScoreboardList roster={roster} values={values} accent={accent} />
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

function ScoreboardList({
  roster,
  values,
  accent,
}: {
  roster: SortOrderParticipant[]
  values: Record<string, number>
  accent: string
}) {
  const sorted = [...roster].sort((a, b) => (values[b.key] ?? 0) - (values[a.key] ?? 0))
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {sorted.length === 0 && <p className="text-center text-sm text-white/30">Belum ada data.</p>}
      {sorted.map((r, i) => (
        <div
          key={r.key}
          className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2.5"
        >
          <span className="text-white">
            <span className="mr-2 font-bold" style={{ color: accent }}>
              #{i + 1}
            </span>
            {r.label}
          </span>
          <span className="font-mono font-bold" style={{ color: accent }}>
            {Math.round(values[r.key] ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}
