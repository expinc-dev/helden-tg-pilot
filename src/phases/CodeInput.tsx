import { useEffect, useState } from 'react'

import type { CodeInputContent, Phase } from '@helden-inc/tg-schema'
import { onValue, ref, runTransaction, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'
import { scorePhase } from '@/lib/scoring/score'
import { useTeamLiveScore } from '@/lib/sync/useTeamLiveScore'
import { useTeams } from '@/lib/sync/useTeams'

import type { Role } from './PhaseRouter'
import { normalizeCode } from './codecheck'

type CodeInputState = {
  attempts: number
  solved: boolean
  solvedAt?: number
  lastGuessNormalized?: string
}

function useCodeInputState(sessionId: string, teamId: string | undefined, phaseId: string) {
  const [state, setState] = useState<CodeInputState>({ attempts: 0, solved: false })
  useEffect(() => {
    if (!teamId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/teams/${teamId}/codeinput/${phaseId}`), (s) =>
      setState(s.val() ?? { attempts: 0, solved: false })
    )
  }, [sessionId, teamId, phaseId])
  return state
}

// The answer is checked SERVER-SIDE now — this device never reads
// content.expected for the decision, only sessions/{id}/secrets/{phaseId}
// does (host-seeded, .read:false to every client — see control.ts and
// database.rules.json). Two separate calls, deliberately not one:
//   1. Bump `attempts` unconditionally (transaction, lockout-aware) — must
//      succeed even on a wrong guess, so the maxAttempts lockout still works.
//   2. Optimistically attempt to set `solved: true` alongside the normalized
//      guess. The RTDB rule on `solved` compares the guess to the secret and
//      REJECTS the whole write if they don't match — a caught exception here
//      just means "wrong," never a value this code computed itself.
// A combined single write would fail step 1 too on a wrong guess (RTDB writes
// are all-or-nothing per call), which is exactly why these stay separate.
async function submitCode(
  sessionId: string,
  teamId: string,
  phaseId: string,
  input: string,
  content: CodeInputContent
): Promise<boolean> {
  const node = ref(rtdb, `sessions/${sessionId}/teams/${teamId}/codeinput/${phaseId}`)
  const guess = normalizeCode(input, content.caseSensitive)

  const tx = await runTransaction(node, (cur: CodeInputState | null) => {
    const s = cur ?? { attempts: 0, solved: false }
    if (s.solved) return s // no-op: undefined would abort, but "already solved" isn't an error
    if (content.maxAttempts && s.attempts >= content.maxAttempts) return s
    return { ...s, attempts: (s.attempts ?? 0) + 1 }
  })
  if (tx.snapshot.val()?.solved) return true // teammate solved it while we were mid-submit

  try {
    // ponytail: Date.now() is fine at pilot scale (matches session/control.ts);
    // swap to serverTimestamp if audited.
    await update(node, { lastGuessNormalized: guess, solved: true, solvedAt: Date.now() })
    return true
  } catch {
    return false // permission-denied from the rule == wrong guess, not a real error
  }
}

// Player + teamId → interactive puzzle for that team. Host/central (no teamId) →
// read-only monitor of every team's progress.
export function TeamCodeInput({
  phase,
  phaseStartMs,
  sessionId,
  role,
  teamId,
}: {
  phase: Phase
  phaseStartMs?: number
  sessionId: string
  role: Role
  teamId?: string
}) {
  if (phase.content.type !== 'codeinput') return null
  const content = phase.content
  if (role !== 'player' || !teamId) {
    return <CodeInputMonitor sessionId={sessionId} phase={phase} phaseStartMs={phaseStartMs} />
  }
  return (
    <CodeInputPlayer
      content={content}
      phase={phase}
      phaseStartMs={phaseStartMs}
      sessionId={sessionId}
      teamId={teamId}
    />
  )
}

function CodeInputPlayer({
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

function CodeInputMonitor({
  sessionId: _sessionId,
  phase,
  phaseStartMs,
}: {
  sessionId: string
  phase: Phase
  phaseStartMs?: number
}) {
  const phaseId = phase.id
  const teams = useTeams(_sessionId)
  const rows = teams
    .map((t) => {
      const st = t.codeinput?.[phaseId]
      const solvedAt = st?.solvedAt
      const elapsedMs = st?.solved && solvedAt && phaseStartMs ? solvedAt - phaseStartMs : 0
      const score = scorePhase(phase, {
        correct: !!st?.solved,
        answered: (st?.attempts ?? 0) > 0,
        elapsedMs,
        phaseDurationMs: (phase.timer?.seconds ?? 0) * 1000,
      })
      return { team: t, st, score }
    })
    .sort((a, b) => b.score - a.score)
  return (
    <div className="flex flex-col gap-2 p-8">
      <p className="text-sm text-gray-500">Team scores</p>
      {rows.length === 0 && <p className="text-sm text-gray-400">No teams yet.</p>}
      {rows.map(({ team, st, score }) => (
        <div
          key={team.id}
          className="flex items-center justify-between rounded border px-3 py-2 text-sm"
        >
          <span>{team.teamName ?? 'Team'}</span>
          <span className="flex items-center gap-3">
            <span className={st?.solved ? 'text-green-600' : 'text-gray-500'}>
              {st?.solved ? 'Solved ✓' : `${st?.attempts ?? 0} attempt(s)`}
            </span>
            <span className="w-16 text-right font-mono tabular-nums">{Math.round(score)} pts</span>
          </span>
        </div>
      ))}
    </div>
  )
}
