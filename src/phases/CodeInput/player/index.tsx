import { useState } from 'react'

import type { CodeInputContent, Phase } from '@helden-inc/tg-schema'

import { useTeamLiveScore } from '@/lib/sync/useTeamLiveScore'

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
  teamId: string
}) {
  const phaseId = phase.id
  const state = useCodeInputState(sessionId, teamId, phaseId)
  const score = useTeamLiveScore(sessionId, teamId, phase, phaseStartMs)
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

  if (state.solved) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-8">
        <p className="text-2xl font-semibold text-green-600">Solved! ✓</p>
        <p className="text-sm text-gray-500">Your team cracked the code.</p>
        <p className="mt-2 text-3xl font-bold tabular-nums">{Math.round(score)} pts</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col items-center gap-4 p-8">
      <p className="text-sm text-gray-500">Assemble the code with your team and enter it.</p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Combined code"
        disabled={lockedOut || busy}
        className="w-60 rounded border px-3 py-2 text-center font-mono tracking-widest"
      />
      <button
        disabled={lockedOut || busy || !input.trim()}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? 'Checking…' : 'Submit'}
      </button>
      {wrong && !lockedOut && <p className="text-sm text-red-600">Not quite — try again.</p>}
      {lockedOut && <p className="text-sm text-red-600">Out of attempts.</p>}
      {remaining !== null && !lockedOut && (
        <p className="text-xs text-gray-400">{remaining} attempt(s) left · shared with your team</p>
      )}
    </form>
  )
}
