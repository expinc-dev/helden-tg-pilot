import type { Phase } from '@helden-inc/tg-schema'
import { get, ref, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

// Player writes their own score here — unlike quizScoring.ts (host-only,
// driven by a synchronized reveal), microlearning is self_paced with no
// host round-trip per step, so a scan attempt's correct/wrong feedback must
// be instant. Mirrors quizScoring's individual/team score-target resolution,
// minus the majority-vote/leader-only ballot logic (that's specific to
// quiz's synchronized reveal — a scan attempt has exactly one actor).
export async function awardScanPoints(
  sessionId: string,
  phase: Phase,
  playerId: string,
  delta: number
): Promise<void> {
  const isTeamMode =
    phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'

  if (isTeamMode) {
    const teamIdSnap = await get(ref(rtdb, `sessions/${sessionId}/players/${playerId}/teamId`))
    const teamId = teamIdSnap.val() as string | null
    if (!teamId) return
    const priorSnap = await get(ref(rtdb, `sessions/${sessionId}/aggregates/teamScores/${teamId}`))
    const prior = typeof priorSnap.val() === 'number' ? priorSnap.val() : 0
    await update(ref(rtdb, `sessions/${sessionId}/aggregates`), {
      [`teamScores/${teamId}`]: prior + delta,
    })
    return
  }

  const priorSnap = await get(ref(rtdb, `sessions/${sessionId}/aggregates/scores/${playerId}`))
  const prior = typeof priorSnap.val() === 'number' ? priorSnap.val() : 0
  await update(ref(rtdb, `sessions/${sessionId}/aggregates`), {
    [`scores/${playerId}`]: prior + delta,
  })
}
