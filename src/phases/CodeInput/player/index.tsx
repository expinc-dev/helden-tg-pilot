import { useState } from 'react'

import { assets } from '@/assets'
import { GradientButton } from '@/components/GradientButton'
import type { CodeInputContent, Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { mmss } from '@/lib/sync/timermath'
import { useTeamLiveScore } from '@/lib/sync/useTeamLiveScore'
import { useTimer } from '@/lib/sync/useTimer'

import { submitCode, useCodeInputState } from '../lib'

export function CodeInputPlayer({
  content,
  phase,
  phaseStartMs,
  sessionId,
  teamId,
}: {
  content: CodeInputContent
  phase: Phase
  phaseStartMs?: number
  sessionId: string
  teamId: string | undefined
}) {
  const phaseId = phase.id
  const state = useCodeInputState(sessionId, teamId, phaseId)
  const score = useTeamLiveScore(sessionId, teamId, phase, phaseStartMs)
  const timer = useTimer(sessionId, phase)
  const timerLabel = timer.active
    ? timer.expired
      ? 'Waktu habis'
      : mmss(timer.remainingSec)
    : undefined
  const [input, setInput] = useState('')
  const [wrong, setWrong] = useState(false)
  const [busy, setBusy] = useState(false)

  const lockedOut = !!content.maxAttempts && state.attempts >= content.maxAttempts
  const remaining = content.maxAttempts ? content.maxAttempts - state.attempts : null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setWrong(false)
    const correct = await submitCode(sessionId, teamId, phaseId, input, content)
    if (!correct) setWrong(true)
    setInput('')
    setBusy(false)
  }

  // Exact copy below is asserted on by e2e/slice.spec.ts for the team-mode
  // case — keep that string unchanged if editing; the room-mode branch is new
  // and free to word differently.
  if (state.solved) {
    return (
      <CodeInputShell title={phase.title} timerLabel={timerLabel}>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex size-20 items-center justify-center rounded-full border border-[#26890C]/40 bg-[#26890C]/20 shadow-[0_0_24px_rgba(38,137,12,0.3)]">
            <Icon icon="mdi:check-circle" className="size-10 text-[#26890C]" />
          </div>
          <p className="text-2xl font-bold text-[#26890C]">Solved! ✓</p>
          <p className="text-sm text-white/60">
            {teamId ? 'Your team cracked the code.' : 'The room cracked the code.'}
          </p>
          <div className="mt-2 rounded-xl border border-white/10 bg-[#121214] px-8 py-3 text-center shadow-inner">
            <span className="block text-xs text-white/40">Skor Tim</span>
            <span className="font-mono text-3xl font-bold text-[#FDDB00] tabular-nums">
              {Math.round(score)} pts
            </span>
          </div>
        </div>
      </CodeInputShell>
    )
  }

  return (
    <CodeInputShell title={phase.title} timerLabel={timerLabel}>
      <form onSubmit={submit} className="flex w-full flex-col items-center gap-4">
        <p className="text-sm text-white/70">
          {teamId
            ? 'Assemble the code with your team and enter it.'
            : 'Assemble the code with the room and enter it.'}
        </p>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Combined code"
          disabled={lockedOut || busy}
          className="w-full rounded-xl border border-white/15 bg-[#121214] px-4 py-3.5 text-center font-mono text-xl tracking-widest text-[#FDDB00] uppercase shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] placeholder:text-white/30 focus:border-[#FDDB00] focus:ring-1 focus:ring-[#FDDB00] focus:outline-none disabled:opacity-40"
        />
        {lockedOut ? (
          <button
            type="button"
            disabled
            className="w-full rounded-lg bg-[#2A2A2A] py-3.5 text-center text-sm font-semibold text-white/30"
          >
            Submit
          </button>
        ) : (
          <GradientButton
            type="submit"
            disabled={busy || !input.trim()}
            className="w-full py-3.5 text-sm font-bold shadow-lg"
          >
            {busy ? 'Checking…' : 'Submit'}
          </GradientButton>
        )}
        {wrong && !lockedOut && (
          <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E21B3C]/30 bg-[#E21B3C]/10 px-3 py-2 text-sm text-[#FF5A5A]">
            <Icon icon="mdi:alert-circle" className="size-4 shrink-0" />
            <span>Not quite — try again.</span>
          </div>
        )}
        {lockedOut && (
          <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E21B3C]/30 bg-[#E21B3C]/10 px-3 py-2 text-sm text-[#FF5A5A]">
            <Icon icon="mdi:lock" className="size-4 shrink-0" />
            <span>Out of attempts.</span>
          </div>
        )}
        {remaining !== null && !lockedOut && (
          <p className="text-xs text-white/40">
            {remaining} attempt(s) left · shared with {teamId ? 'your team' : 'the room'}
          </p>
        )}
      </form>
    </CodeInputShell>
  )
}

// Same background-image + card language as CodePieceShell/ReflectionShell/
// SortOrderShell — the paired phase to this one, so the two don't read as
// different apps back to back.
function CodeInputShell({
  title,
  timerLabel,
  children,
}: {
  title: string
  timerLabel?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-cover bg-top p-4 sm:p-6"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#353535] bg-black/50 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center text-center">
          {timerLabel && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-1 font-mono text-sm text-[#FDDB00] tabular-nums">
              <Icon icon="mdi:clock-outline" className="size-4" />
              <span>{timerLabel}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
