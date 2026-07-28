import { useEffect, useState } from 'react'

import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'
import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'
import { scorePhase } from '@/lib/scoring/score'
import { useTeams } from '@/lib/sync/useTeams'

import type { CodeInputState } from '../lib'

function scoreCodeInput(
  phase: Phase,
  phaseStartMs: number | undefined,
  st: CodeInputState | undefined
) {
  const solvedAt = st?.solvedAt
  const elapsedMs = st?.solved && solvedAt && phaseStartMs ? solvedAt - phaseStartMs : 0
  return scorePhase(phase, {
    correct: !!st?.solved,
    answered: (st?.attempts ?? 0) > 0,
    elapsedMs,
    phaseDurationMs: (phase.timer?.seconds ?? 0) * 1000,
  })
}

type Row = { key: string; label: string; st: CodeInputState | undefined; score: number }

function useRows(
  sessionId: string,
  phase: Phase,
  phaseStartMs: number | undefined,
  allowTeams: boolean
): Row[] {
  const phaseId = phase.id
  const teams = useTeams(sessionId)
  const [roomState, setRoomState] = useState<CodeInputState | null>(null)

  useEffect(() => {
    if (allowTeams) return
    return onValue(ref(rtdb, `sessions/${sessionId}/codeinput/${phaseId}`), (s) =>
      setRoomState(s.val() ?? null)
    )
  }, [allowTeams, sessionId, phaseId])

  if (!allowTeams) {
    return [
      {
        key: 'room',
        label: 'Room',
        st: roomState ?? undefined,
        score: scoreCodeInput(phase, phaseStartMs, roomState ?? undefined),
      },
    ]
  }

  return teams
    .map((t) => {
      const st = (t.codeinput as Record<string, CodeInputState> | undefined)?.[phaseId]
      return {
        key: t.id,
        label: t.teamName ?? 'Team',
        st,
        score: scoreCodeInput(phase, phaseStartMs, st),
      }
    })
    .sort((a, b) => b.score - a.score)
}

// Read-only view of progress. Shown to host AND central — the code puzzle
// itself is played only on player devices. Team mode: one row per team.
// Room mode: a single shared row — everyone's solving the same puzzle
// together, same as team mode conceptually, just without a formal team.

// Big-screen view — same full-bleed background + centered layout as
// CentralQuiz/CentralSortOrder/CentralCodePiece, so this doesn't sit as a
// plain unstyled list on central's own bare page shell.
export function CentralCodeInput({
  sessionId,
  phase,
  phaseStartMs,
  allowTeams,
}: {
  sessionId: string
  phase: Phase
  phaseStartMs?: number
  allowTeams: boolean
}) {
  const rows = useRows(sessionId, phase, phaseStartMs, allowTeams)
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 overflow-y-auto p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Icon icon="mdi:key-variant" className="size-16 text-[#FFB800]" />
      <h1 className="text-center text-4xl font-bold text-white drop-shadow-lg">{phase.title}</h1>
      <p className="text-xl text-white/50">{allowTeams ? 'Team scores' : 'Room score'}</p>
      <RowList rows={rows} empty="No teams yet." />
    </div>
  )
}

// Host's embedded view — sits inside the host page's own already-dark card
// (matches HostQuiz/HostSortOrder/HostCodePiece).
export function HostCodeInput({
  sessionId,
  phase,
  phaseStartMs,
  allowTeams,
}: {
  sessionId: string
  phase: Phase
  phaseStartMs?: number
  allowTeams: boolean
}) {
  const rows = useRows(sessionId, phase, phaseStartMs, allowTeams)
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#181818] p-4">
      <p className="text-sm text-white/50">{allowTeams ? 'Team scores' : 'Room score'}</p>
      <RowList rows={rows} empty="No teams yet." />
    </div>
  )
}

function RowList({ rows, empty }: { rows: Row[]; empty: string }) {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {rows.length === 0 && <p className="text-sm text-white/30">{empty}</p>}
      {rows.map((r) => (
        <div
          key={r.key}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm"
        >
          <span className="text-white/80">{r.label}</span>
          <span className="flex items-center gap-3">
            <span className={r.st?.solved ? 'text-[#26890C]' : 'text-white/40'}>
              {r.st?.solved ? 'Solved ✓' : `${r.st?.attempts ?? 0} attempt(s)`}
            </span>
            <span className="w-16 text-right font-mono font-bold text-[#FFB800] tabular-nums">
              {Math.round(r.score)} pts
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
