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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#26890C]/20">
          <Icon icon="mdi:check-circle" className="size-10 text-[#26890C]" />
        </div>
        <p className="text-2xl font-semibold text-[#26890C]">Solved! ✓</p>
        <p className="text-sm text-white/50">
          {teamId ? 'Your team cracked the code.' : 'The room cracked the code.'}
        </p>
        <p className="mt-2 text-3xl font-bold text-[#FFB800] tabular-nums">
          {Math.round(score)} pts
        </p>
      </CodeInputShell>
    )
  }

  return (
    <CodeInputShell title={phase.title} timerLabel={timerLabel}>
      <form onSubmit={submit} className="flex w-full flex-col items-center gap-4">
        <p className="text-sm text-white/50">
          {teamId
            ? 'Assemble the code with your team and enter it.'
            : 'Assemble the code with the room and enter it.'}
        </p>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Combined code"
          disabled={lockedOut || busy}
          className="w-full rounded-xl border border-white/10 bg-[#1C1C1E] px-3 py-3 text-center font-mono text-lg tracking-widest text-white placeholder:text-white/30 focus:outline-none disabled:opacity-40"
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
            className="w-full py-3.5 text-sm"
          >
            {busy ? 'Checking…' : 'Submit'}
          </GradientButton>
        )}
        {wrong && !lockedOut && <p className="text-sm text-[#E21B3C]">Not quite — try again.</p>}
        {lockedOut && <p className="text-sm text-[#E21B3C]">Out of attempts.</p>}
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
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cover bg-top p-6 text-center"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      {timerLabel && (
        <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-lg text-[#FFB800] tabular-nums">
          {timerLabel}
        </span>
      )}
      <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
      <h1 className="text-xl font-bold text-[#FFB800]">{title}</h1>
      {children}
    </div>
  )
}
