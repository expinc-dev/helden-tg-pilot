import { update } from 'firebase/database'

import { normalizeCode } from '@/phases/codecheck'

import { eref } from '@/lib/firebase'

// BRIGHT-967: the real QR-trigger for advancing a sort_order round. Sibling
// to the existing qr_scan Question block (useQrDetector/ScanQuestion), NOT a
// modification of it - that path serves unrelated qr_scan content blocks
// (client-side compare, verify+score only) and must keep working unchanged.
// This one has actual gameplay consequences (skips the physical scan
// requirement if faked), so it needs a server-side decision, not a client
// compare - see database.rules.json's roundState/{phaseId}/round rule.
//
// Writes `round` and `lastGuessNormalized` in the SAME update() call so the
// RTDB rule on `round` can read the sibling it needs to validate against
// (exact pattern CodeInput/lib.ts#submitCode already uses for the same
// reason). This device never learns the correct code, only whether its
// guess round-tripped: a permission-denied throw from the rule rejecting the
// write means "wrong code", not a real error - caught and reported as such,
// never surfaced as an app error.
export async function submitRoundTrigger(
  sessionId: string,
  phaseId: string,
  currentRound: number,
  decoded: string
): Promise<boolean> {
  const targetRound = currentRound + 1
  const guess = normalizeCode(decoded)
  try {
    await update(eref(`sessions/${sessionId}/roundState/${phaseId}`), {
      round: targetRound,
      lastGuessNormalized: guess,
    })
    return true
  } catch {
    return false
  }
}
