import type { Phase } from '@helden-inc/tg-schema'
import { get, update } from 'firebase/database'

import { eref } from '@/lib/firebase'
import { scoreAnswer } from '@/lib/scoring/score'

import { type Outcome, type QuestionResult, applyQuestionResults } from './quizTotals'

// Host-only. Called on reveal and again when the leaderboard opens: reads all
// player answers for the question, scores them against the correct answer and
// folds the result into aggregates/scores (individual) or aggregates/teamScores
// (team modes). Idempotent per question (see quizTotals.ts) — running it twice
// replaces that question's contribution instead of adding it again, so answers
// that land just after the first pass are picked up by the second.
export async function scoreQuizQuestion(opts: {
  sessionId: string
  phase: Phase
  questionIndex: number
  correctId: string
  timerSeconds: number
  // Server-clock ms when this question opened (centralStep.startedAt). Falls
  // back to the phase start for steps written before startedAt existed.
  questionStartMs?: number
}) {
  const { sessionId, phase, questionIndex, correctId, timerSeconds, questionStartMs } = opts
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
  const phaseStartMs =
    questionStartMs ?? (pointerSnap.val()?.changedAt as number | undefined) ?? Date.now()

  // An opinion question carries no answer key (correctId ''): answering it is the
  // only signal, so an answer counts as a positive verdict (never "wrong") and
  // only participation scoring awards points.
  const graded = correctId !== ''
  const isTeamMode =
    phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'

  // Raw per-player verdicts: score, correctness, and (team modes) the votes.
  const playerScores: Record<string, number> = {}
  const playerCorrect: Record<string, boolean> = {}
  const teamAnswers: Record<string, { optionId: string; submittedAt: number }[]> = {}

  for (const [playerId, p] of Object.entries(players)) {
    if (!p) continue
    const ans = p.answers?.[qId]
    if (!ans) continue
    const submittedAt = typeof ans.submittedAt === 'number' ? ans.submittedAt : Date.now()
    const elapsedMs = Math.max(0, submittedAt - phaseStartMs)
    const correct = graded && ans.value === correctId
    playerCorrect[playerId] = graded ? correct : true

    if (isTeamMode && p.teamId) {
      if (!teamAnswers[p.teamId]) teamAnswers[p.teamId] = []
      teamAnswers[p.teamId].push({ optionId: String(ans.value), submittedAt })
    }

    playerScores[playerId] = scoreAnswer(phase.scoring, {
      correct,
      answered: true,
      elapsedMs,
      phaseDurationMs,
    })
  }

  // Result per scoring key (playerId, or teamId in team modes). Not answering is
  // a `wrong` outcome with 0 points.
  const results: Record<string, QuestionResult> = {}
  const outcomeOf = (correct: boolean | undefined): Outcome => (correct ? 'correct' : 'wrong')

  if (isTeamMode) {
    // team_leader_only: leader's score = team score
    // team_collaborative: majority vote determines correctness, earliest majority timestamp for speed
    const teamsSnap = await get(eref(`sessions/${sessionId}/teams`))
    const teams = (teamsSnap.val() ?? {}) as Record<string, { ownerPlayerId?: string }>

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
          teamCorrect = graded ? best.optionId === correctId : true
          const elapsedMs = Math.max(0, best.earliestAt - phaseStartMs)
          teamScore = scoreAnswer(phase.scoring, {
            correct: graded && teamCorrect,
            answered: true,
            elapsedMs,
            phaseDurationMs,
          })
        }
      }
      results[teamId] = { score: teamScore, outcome: outcomeOf(teamCorrect) }
    }
  } else {
    // Everyone present is scored, answered or not.
    for (const playerId of Object.keys(players)) {
      if (!players[playerId]) continue
      results[playerId] = {
        score: playerScores[playerId] ?? 0,
        outcome: outcomeOf(playerCorrect[playerId]),
      }
    }
  }

  if (Object.keys(results).length === 0) return

  const base = `sessions/${sessionId}/aggregates`
  const totalsKey = isTeamMode ? 'teamScores' : 'scores'
  const correctKey = isTeamMode ? 'teamCorrectCount' : 'correctCount'
  const wrongKey = isTeamMode ? 'teamWrongCount' : 'wrongCount'
  const [totalsSnap, correctSnap, wrongSnap, prevScoresSnap, prevOutcomesSnap] = await Promise.all([
    get(eref(`${base}/${totalsKey}`)),
    get(eref(`${base}/${correctKey}/${phase.id}`)),
    get(eref(`${base}/${wrongKey}/${phase.id}`)),
    get(eref(`${base}/questionScores/${qId}`)),
    get(eref(`${base}/questionOutcome/${qId}`)),
  ])
  const folded = applyQuestionResults({
    results,
    prevScores: (prevScoresSnap.val() ?? {}) as Record<string, number>,
    prevOutcomes: (prevOutcomesSnap.val() ?? {}) as Record<string, Outcome>,
    totals: (totalsSnap.val() ?? {}) as Record<string, number>,
    correctCount: (correctSnap.val() ?? {}) as Record<string, number>,
    wrongCount: (wrongSnap.val() ?? {}) as Record<string, number>,
  })

  const patch: Record<string, unknown> = {}
  for (const [key, r] of Object.entries(results)) {
    patch[`${totalsKey}/${key}`] = folded.totals[key]
    patch[`${correctKey}/${phase.id}/${key}`] = folded.correctCount[key]
    patch[`${wrongKey}/${phase.id}/${key}`] = folded.wrongCount[key]
    patch[`questionScores/${qId}/${key}`] = r.score
    patch[`questionOutcome/${qId}/${key}`] = r.outcome
  }
  await update(eref(base), patch)
}

// Safety net for the phase boundary: a host who leaves a quiz with "Tahap
// Selanjutnya" without pressing "Perlihatkan Jawaban" on the last question would
// otherwise leave that question unscored. Scores every question that has answers
// but no questionScores node yet (scoreQuizQuestion stays idempotent, so this is
// also safe after a normal reveal).
export async function scoreUnscoredQuestions(opts: {
  sessionId: string
  phase: Phase
  questions: { correctId?: string }[]
  timerSeconds: number
}) {
  const { sessionId, phase, questions, timerSeconds } = opts
  const [playersSnap, scoredSnap] = await Promise.all([
    get(eref(`sessions/${sessionId}/players`)),
    get(eref(`sessions/${sessionId}/aggregates/questionScores`)),
  ])
  const players = (playersSnap.val() ?? {}) as Record<string, { answers?: Record<string, unknown> }>
  const scored = (scoredSnap.val() ?? {}) as Record<string, unknown>
  for (let i = 0; i < questions.length; i++) {
    const qId = `${phase.id}_q${i}`
    if (scored[qId]) continue
    if (!Object.values(players).some((p) => p?.answers?.[qId])) continue
    await scoreQuizQuestion({
      sessionId,
      phase,
      questionIndex: i,
      correctId: questions[i].correctId ?? '',
      timerSeconds,
    })
  }
}
