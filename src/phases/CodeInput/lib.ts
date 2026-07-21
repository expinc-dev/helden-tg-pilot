import { useEffect, useState } from 'react'

import type { CodeInputContent } from '@helden-inc/tg-schema'
import { onValue, ref, runTransaction, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

import { normalizeCode } from '../codecheck'

export type CodeInputState = {
  attempts: number
  solved: boolean
  solvedAt?: number
  lastGuessNormalized?: string
}

export function useCodeInputState(sessionId: string, teamId: string | undefined, phaseId: string) {
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
export async function submitCode(
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
