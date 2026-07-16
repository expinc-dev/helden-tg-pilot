import type { Phase } from '@helden-inc/tg-schema'
import { get, ref, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'
import { scoreAnswer } from '@/lib/scoring/score'

// Host-only. Called on reveal: reads all player answers for the current question,
// computes scores against the correct answer from secrets/, and writes accumulated
// scores to aggregates/scores (individual) or aggregates/teamScores (team modes).
export async function scoreQuizQuestion(opts: {
  sessionId: string
  phase: Phase
  questionIndex: number
  correctId: string
  timerSeconds: number
}) {
  const { sessionId, phase, questionIndex, correctId, timerSeconds } = opts
  const qId = `${phase.id}_q${questionIndex}`
  const phaseDurationMs = timerSeconds * 1000

  const [playersSnap, pointerSnap] = await Promise.all([
    get(ref(rtdb, `sessions/${sessionId}/players`)),
    get(ref(rtdb, `sessions/${sessionId}/phasePointer`)),
  ])
  const players = (playersSnap.val() ?? {}) as Record<
    string,
    { answers?: Record<string, { value: unknown; submittedAt?: number }>; teamId?: string }
  >
  const phaseStartMs = (pointerSnap.val()?.changedAt as number | undefined) ?? Date.now()

  const isTeamMode =
    phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'

  // Collect per-player scores
  const playerScores: Record<string, number> = {}
  const teamAnswers: Record<string, { optionId: string; submittedAt: number }[]> = {}

  for (const [playerId, p] of Object.entries(players)) {
    if (!p) continue
    const ans = p.answers?.[qId]
    if (!ans) {
      playerScores[playerId] = 0
      continue
    }
    const submittedAt = typeof ans.submittedAt === 'number' ? ans.submittedAt : Date.now()
    const elapsedMs = Math.max(0, submittedAt - phaseStartMs)
    const correct = ans.value === correctId

    if (isTeamMode && p.teamId) {
      if (!teamAnswers[p.teamId]) teamAnswers[p.teamId] = []
      teamAnswers[p.teamId].push({ optionId: String(ans.value), submittedAt })
    }

    const score = scoreAnswer(phase.scoring, {
      correct,
      answered: true,
      elapsedMs,
      phaseDurationMs,
    })
    playerScores[playerId] = score
  }

  // Build the scores patch
  const patch: Record<string, unknown> = {}

  if (isTeamMode) {
    // team_leader_only: leader's score = team score
    // team_collaborative: majority vote determines correctness, earliest majority timestamp for speed
    const teamsSnap = await get(ref(rtdb, `sessions/${sessionId}/teams`))
    const teams = (teamsSnap.val() ?? {}) as Record<string, { ownerPlayerId?: string }>
    const priorSnap = await get(ref(rtdb, `sessions/${sessionId}/aggregates/teamScores`))
    const prior = (priorSnap.val() ?? {}) as Record<string, number>

    for (const [teamId, team] of Object.entries(teams)) {
      let teamScore = 0
      if (phase.teamMode === 'team_leader_only') {
        teamScore = team.ownerPlayerId ? (playerScores[team.ownerPlayerId] ?? 0) : 0
      } else {
        // team_collaborative: majority vote
        const votes = teamAnswers[teamId] ?? []
        const tally: Record<string, { count: number; earliestAt: number }> = {}
        for (const v of votes) {
          if (!tally[v.optionId]) tally[v.optionId] = { count: 0, earliestAt: v.submittedAt }
          tally[v.optionId].count++
          tally[v.optionId].earliestAt = Math.min(tally[v.optionId].earliestAt, v.submittedAt)
        }
        let best = { optionId: '', count: 0, earliestAt: Date.now() }
        for (const [optionId, t] of Object.entries(tally)) {
          if (t.count > best.count || (t.count === best.count && t.earliestAt < best.earliestAt)) {
            best = { optionId, ...t }
          }
        }
        if (best.optionId) {
          const correct = best.optionId === correctId
          const elapsedMs = Math.max(0, best.earliestAt - phaseStartMs)
          teamScore = scoreAnswer(phase.scoring, {
            correct,
            answered: true,
            elapsedMs,
            phaseDurationMs,
          })
        }
      }
      patch[`teamScores/${teamId}`] = (prior[teamId] ?? 0) + teamScore
    }
  } else {
    // individual mode
    const priorSnap = await get(ref(rtdb, `sessions/${sessionId}/aggregates/scores`))
    const prior = (priorSnap.val() ?? {}) as Record<string, number>
    for (const [playerId, score] of Object.entries(playerScores)) {
      patch[`scores/${playerId}`] = (prior[playerId] ?? 0) + score
    }
  }

  if (Object.keys(patch).length > 0) {
    await update(ref(rtdb, `sessions/${sessionId}/aggregates`), patch)
  }
}
