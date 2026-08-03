import { useState } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { TimerRing } from '@/phases/Quiz/TimerRing'

import { resetPhase } from '@/lib/session/control'
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
import { PlayerAnswersPanel } from './components/PlayerAnswersPanel'

const strokeContainer = '1px solid var(--Stroke-Container, #353535)'

// Host's live view: while the round is running, the same "question card +
// item list + submission progress" shell as Quiz's host screen, so the host
// isn't staring at a bare roster while the room plays. Once the phase timer
// expires (naturally, or forced early via the page shell's "Perlihatkan Skor"
// button — see lobby/index.tsx's MinigameHostAction, which shares this same
// `timer` node so it flips in lockstep with this component) the item list
// re-sorts into the correct order with a reveal treatment, followed by each
// participant's game score alongside their running total. Advancing the
// phase itself ("Akhiri Level") is also owned by that page-level shell, not
// this component — it needs to occupy the same bottom slot regardless of
// which of the two labels/actions is currently active.
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
  const totalSec = phase.timer?.seconds ?? 60
  const submittedCount = roster.filter((r) => answers[r.writerId]).length
  const [resetting, setResetting] = useState(false)
  const [answersOpen, setAnswersOpen] = useState(false)
  const gameValues: Record<string, number> = Object.fromEntries(
    roster.map((r) => [r.key, previewScore(phase, config, phaseStartMs, answers[r.writerId])])
  )

  // Testing aid, not a player-facing feature — re-stamps a fresh timer for
  // this phase; each player's own client reacts by clearing its own answer
  // (see SortOrderPlayerActive), so QA can replay the level without spinning
  // up a whole new session. Confirmed because it discards whatever real
  // players have already submitted.
  const handleReset = async () => {
    if (resetting) return
    if (!window.confirm('Reset jawaban semua peserta untuk level ini?')) return
    setResetting(true)
    try {
      await resetPhase(sessionId, phase)
    } finally {
      setResetting(false)
    }
  }

  // Pre-reveal: items in authored/display order, plain badges. Post-reveal:
  // re-sorted into the correct order, each row given the same reveal
  // treatment Quiz's AnswerOptionsList uses for its correct answer.
  const displayItems = ready
    ? config.correctOrder
        .map((id) => config.items.find((it) => it.id === id))
        .filter((it): it is SortOrderConfig['items'][number] => !!it)
    : config.items

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        {ready ? (
          <button
            type="button"
            onClick={() => setAnswersOpen(true)}
            aria-label="Jawaban Pemain"
            className="flex size-8 items-center justify-center rounded-lg bg-[#FFB800] text-black shadow transition hover:brightness-110"
          >
            <Icon icon="mdi:format-list-checks" className="size-4" />
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white disabled:opacity-40"
        >
          {resetting ? 'Mereset…' : 'Reset Level'}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center gap-4">
        {!ready && timer.active && (
          <TimerRing
            remainingSec={timer.remainingSec}
            totalSec={totalSec}
            expired={timer.expired}
            size={90}
          />
        )}

        <div className="w-full rounded-xl p-5" style={{ background: '#181818' }}>
          <p className="text-lg leading-relaxed font-semibold text-white">{phase.title}</p>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          {displayItems.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3"
              style={
                ready
                  ? {
                      borderRadius: 8,
                      border: strokeContainer,
                      background: 'rgba(81, 206, 146, 0.16)',
                    }
                  : { borderRadius: 8, border: '1px solid #2a2a2a' }
              }
            >
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                style={{
                  borderColor: ready ? '#26890C' : '#4a4a4a',
                  background: ready ? '#26890C' : 'transparent',
                  color: ready ? '#fff' : '#9a9a9a',
                }}
              >
                {i + 1}
              </div>
              <span className="flex-1 text-sm text-white/80">{item.label}</span>
              {ready && (
                <Icon
                  icon="mdi:check-circle"
                  className="size-5 shrink-0"
                  style={{ color: '#26890C' }}
                />
              )}
            </div>
          ))}
        </div>

        {!ready && (
          <div className="mt-auto flex w-full items-center gap-3 rounded-lg border border-white/15 bg-[rgba(253,219,0,0.08)] px-4 py-2.5">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#FFB800] transition-all duration-500"
                style={{
                  width: `${roster.length > 0 ? (submittedCount / roster.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="shrink-0 text-xs whitespace-nowrap text-white/60">
              <span className="font-bold text-white">{submittedCount}</span> dari{' '}
              <span className="font-bold text-white">{roster.length}</span> pemain telah menjawab
            </span>
          </div>
        )}
      </div>

      {ready && (
        <div className="flex flex-col gap-2">
          {roster.length === 0 && <p className="text-sm text-gray-400">Belum ada peserta.</p>}
          {roster.map((r) => (
            <div
              key={r.key}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm"
            >
              <span className="text-white/80">{r.label}</span>
              <span className="flex items-center gap-3 font-mono">
                <span className="text-[#2FB8FF]">
                  {Math.round(previewScore(phase, config, phaseStartMs, answers[r.writerId]))} game
                </span>
                <span className="text-[#FFB800]">{Math.round(cumulative[r.key] ?? 0)} total</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {answersOpen && (
        <PlayerAnswersPanel
          roster={roster}
          answers={answers}
          config={config}
          values={gameValues}
          onClose={() => setAnswersOpen(false)}
        />
      )}
    </div>
  )
}
