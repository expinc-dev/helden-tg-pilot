import { useEffect, useRef, useState } from 'react'

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

// Big-screen view — styled with Option 2 split terminal layout,
// full-bleed background + keypad pin indicator + popup modals for Solved & Wrong.
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

  const anySolved = rows.some((r) => r.st?.solved)
  const totalAttempts = rows.reduce((sum, r) => sum + (r.st?.attempts ?? 0), 0)

  const solvedCount = rows.filter((r) => r.st?.solved).length

  const [popup, setPopup] = useState<'solved' | 'wrong' | null>(null)
  const hydratedRef = useRef(false)
  const prevAttemptsRef = useRef(totalAttempts)
  const prevSolvedRef = useRef(anySolved)

  useEffect(() => {
    // First effect run after rows hydrate = baseline snapshot, not a state
    // change — a central joining mid-phase (reconnect, late mount) must not
    // fire solved/wrong popups for attempts that happened before it arrived.
    if (!hydratedRef.current) {
      hydratedRef.current = true
      prevAttemptsRef.current = totalAttempts
      prevSolvedRef.current = anySolved
      return
    }

    if (anySolved && !prevSolvedRef.current) {
      setPopup('solved')
    } else if (!anySolved && totalAttempts > prevAttemptsRef.current) {
      setPopup('wrong')
    }

    prevAttemptsRef.current = totalAttempts
    prevSolvedRef.current = anySolved
  }, [anySolved, totalAttempts])

  // Wrong-guess popup clears itself after 3s so a busy team-mode room doesn't
  // stack dismissed modals on the big screen; the solved popup stays manual.
  useEffect(() => {
    if (popup !== 'wrong') return
    const t = setTimeout(() => setPopup(null), 3000)
    return () => clearTimeout(t)
  }, [popup])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-8 lg:p-12"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="grid h-full max-h-[85vh] w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Panel: Terminal Info */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-md lg:col-span-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-[#FDDB00]/30 bg-[#FDDB00]/10">
                <Icon icon="mdi:terminal" className="size-6 text-[#FDDB00]" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#FDDB00]">Sistem Terminal</h2>
            </div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow-md">{phase.title}</h1>
            <p className="text-sm leading-relaxed text-white/70">
              Masukkan kode gabungan bersama tim untuk membuka kunci tahap berikutnya.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
            <span>Status</span>
            <span className="font-semibold text-[#FDDB00]">
              {solvedCount} dari {rows.length} selesai
            </span>
          </div>
        </div>

        {/* Right Panel: Pin Indicator & Scores Leaderboard */}
        <div className="flex flex-col overflow-y-auto rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-md lg:col-span-8">
          {/* Top 8-Dot Sequence Indicator (Option 2) */}
          <div className="mb-6 flex w-full items-center justify-center gap-4 rounded-xl border border-white/10 bg-gradient-to-b from-[#18181A] to-[#0A0A0C] px-6 py-5 shadow-inner">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="size-3 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
              />
            ))}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              {allowTeams ? 'Team scores' : 'Room score'}
            </h3>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
              {rows.length} {allowTeams ? 'Tim' : 'Peserta'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <RowList rows={rows} empty="No teams yet." />
          </div>
        </div>
      </div>

      {/* Solved Popup Modal */}
      {popup === 'solved' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#141416] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-[#FDDB00]">Kode Benar!</h3>
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <Icon icon="mdi:close" className="size-5" />
              </button>
            </div>

            <p className="py-5 text-sm leading-relaxed text-white/80">
              Kode berhasil diverifikasi. Kunci telah terbuka dan kamu dapat melanjutkan ke tahap
              berikutnya.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="rounded-lg border border-white/10 bg-[#222226] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2A2A30]"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="rounded-lg bg-gradient-to-r from-[#FDDB00] to-[#FDA400] px-6 py-2.5 text-sm font-bold text-black shadow-md hover:opacity-90"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wrong Popup Modal */}
      {popup === 'wrong' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E21B3C]/40 bg-[#141416] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-[#FF3B30]">Kode Salah</h3>
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <Icon icon="mdi:close" className="size-5" />
              </button>
            </div>

            <p className="py-5 text-sm leading-relaxed text-white/80">
              Kode yang kamu masukkan belum sesuai. Periksa kembali petunjuk yang ada, lalu coba
              lagi.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="w-full rounded-lg bg-[#E21B3C] py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#D01735]"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#181818] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:key-variant" className="size-5 text-[#FDDB00]" />
          <h2 className="text-sm font-bold text-white">
            {allowTeams ? 'Team scores' : 'Room score'}
          </h2>
        </div>
        <span className="text-xs text-white/50">{phase.title}</span>
      </div>
      <RowList rows={rows} empty="No teams yet." />
    </div>
  )
}

function RowList({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <p className="text-sm text-white/40">{empty}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div
          key={r.key}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121214] px-4 py-3 text-sm shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-8 items-center justify-center rounded-lg ${
                r.st?.solved
                  ? 'border border-[#26890C]/30 bg-[#26890C]/20 text-[#26890C]'
                  : 'border border-white/10 bg-white/5 text-white/40'
              }`}
            >
              <Icon
                icon={r.st?.solved ? 'mdi:check-bold' : 'mdi:account-group'}
                className="size-4"
              />
            </div>
            <span className="font-semibold text-white/90">{r.label}</span>
          </div>

          <div className="flex items-center gap-4">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                r.st?.solved
                  ? 'border border-[#26890C]/30 bg-[#26890C]/20 text-[#26890C]'
                  : 'bg-white/5 text-white/50'
              }`}
            >
              {r.st?.solved ? 'Solved ✓' : `${r.st?.attempts ?? 0} attempt(s)`}
            </span>
            <span className="w-16 text-right font-mono font-bold text-[#FDDB00] tabular-nums">
              {Math.round(r.score)} pts
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
