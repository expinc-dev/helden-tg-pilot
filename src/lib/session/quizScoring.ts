import type { Phase } from '@helden-inc/tg-schema'
import { get, update } from 'firebase/database'

import { eref } from '@/lib/firebase'
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
    get(eref(`sessions/${sessionId}/players`)),
    get(eref(`sessions/${sessionId}/phasePointer`)),
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
  const playerCorrect: Record<string, boolean> = {}
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
    playerCorrect[playerId] = correct

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
    const [teamsSnap, priorSnap, priorCorrectSnap, priorWrongSnap] = await Promise.all([
      get(eref(`sessions/${sessionId}/teams`)),
      get(eref(`sessions/${sessionId}/aggregates/teamScores`)),
      get(eref(`sessions/${sessionId}/aggregates/teamCorrectCount/${phase.id}`)),
      get(eref(`sessions/${sessionId}/aggregates/teamWrongCount/${phase.id}`)),
    ])
    const teams = (teamsSnap.val() ?? {}) as Record<string, { ownerPlayerId?: string }>
    const prior = (priorSnap.val() ?? {}) as Record<string, number>
    const priorCorrect = (priorCorrectSnap.val() ?? {}) as Record<string, number>
    const priorWrong = (priorWrongSnap.val() ?? {}) as Record<string, number>

    for (const [teamId, team] of Object.entries(teams)) {
      let teamScore = 0
      let teamCorrect: boolean | undefined
      if (phase.teamMode === 'team_leader_only') {
        if (team.ownerPlayerId && team.ownerPlayerId in playerCorrect) {
          teamCorrect = playerCorrect[team.ownerPlayerId]
          teamScore = playerScores[team.ownerPlayerId] ?? 0
        }
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
          teamCorrect = best.optionId === correctId
          const elapsedMs = Math.max(0, best.earliestAt - phaseStartMs)
          teamScore = scoreAnswer(phase.scoring, {
            correct: teamCorrect,
            answered: true,
            elapsedMs,
            phaseDurationMs,
          })
        }
      }
      patch[`teamScores/${teamId}`] = (prior[teamId] ?? 0) + teamScore
      if (teamCorrect !== undefined) {
        const key = teamCorrect ? 'teamCorrectCount' : 'teamWrongCount'
        const priorMap = teamCorrect ? priorCorrect : priorWrong
        patch[`${key}/${phase.id}/${teamId}`] = (priorMap[teamId] ?? 0) + 1
      }
    }
  } else {
    // individual mode
    const [priorSnap, priorCorrectSnap, priorWrongSnap] = await Promise.all([
      get(eref(`sessions/${sessionId}/aggregates/scores`)),
      get(eref(`sessions/${sessionId}/aggregates/correctCount/${phase.id}`)),
      get(eref(`sessions/${sessionId}/aggregates/wrongCount/${phase.id}`)),
    ])
    const prior = (priorSnap.val() ?? {}) as Record<string, number>
    const priorCorrect = (priorCorrectSnap.val() ?? {}) as Record<string, number>
    const priorWrong = (priorWrongSnap.val() ?? {}) as Record<string, number>
    for (const [playerId, score] of Object.entries(playerScores)) {
      patch[`scores/${playerId}`] = (prior[playerId] ?? 0) + score
      if (playerId in playerCorrect) {
        const key = playerCorrect[playerId] ? 'correctCount' : 'wrongCount'
        const priorMap = playerCorrect[playerId] ? priorCorrect : priorWrong
        patch[`${key}/${phase.id}/${playerId}`] = (priorMap[playerId] ?? 0) + 1
      }
    }
  }

  if (Object.keys(patch).length > 0) {
    await update(eref(`sessions/${sessionId}/aggregates`), patch)
  }
}
