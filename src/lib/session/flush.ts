import type { Phase } from '@helden-inc/tg-schema'
import { get, ref, serverTimestamp, update } from 'firebase/database'

import { minigameRegistry } from '@/phases/minigames/registry'

import { rtdb } from '@/lib/firebase'
import { scorePhase } from '@/lib/scoring/score'

import { type Contribution, aggregateForPhase } from './flushAggregate'

// Host-only. Called from control.ts::nextPhase BEFORE the phasePointer moves.
// Reads sessions/{id}/{players,teams} for the outgoing phase, computes durable
// results via the pure aggregateForPhase router, writes to RTDB:
//   sessions/{id}/results/{playerId}     (individual)
//   sessions/{id}/teamResults/{teamId}   (team modes)
//   sessions/{id}/aggregates/scores      or  /teamScores  (live map)
//
// Blueprint says Firestore for durable data, but the pilot uses RTDB only —
// same store, same shape as the tg-schema PlayerResult / TeamResult types.
//
// Per-content-type correctness resolvers live in `resolveCorrectness()` below.
// Add a new case there when a scored phase type ships.

interface PresenceNode {
  name?: string
  connected?: boolean
  teamId?: string
}
interface TeamNode {
  ownerPlayerId?: string
  codeinput?: Record<string, { attempts?: number; solved?: boolean; solvedAt?: number }>
}
interface PlayerLiveNode extends PresenceNode {
  answers?: Record<string, { value: unknown; submittedAt?: number }>
  status?: string
}

interface CorrectnessSignal {
  correct: boolean
  answered: boolean
  elapsedMs: number
}

// Per-content-type correctness for one participant. Extend the switch when new
// scored phase types ship (quiz, minigame, …). Returning `null` means "this
// content type doesn't produce a score" — participant scores 0.
function resolveCorrectness(
  phase: Phase,
  ctx: {
    playerId: string
    teamId?: string
    player: PlayerLiveNode
    team?: TeamNode
    phaseStartMs: number
  }
): CorrectnessSignal | null {
  switch (phase.content.type) {
    case 'codeinput': {
      // Team-scoped in the pilot (teams/{teamId}/codeinput/{phaseId}).
      const st = ctx.team?.codeinput?.[phase.id]
      if (!st) return null
      const elapsedMs = st.solved && st.solvedAt ? st.solvedAt - ctx.phaseStartMs : 0
      return {
        correct: !!st.solved,
        answered: (st.attempts ?? 0) > 0,
        elapsedMs,
      }
    }
    case 'minigame': {
      // Delegate to the template's own scorer (registry lookup by templateId).
      // Unknown/invalid → null → participant scores 0. Same fallback path the
      // renderer uses when it hits UnknownTemplate.
      const template = minigameRegistry.get(phase.content.templateId)
      if (!template) return null
      const parsed = template.configSchema.safeParse(phase.content.config)
      if (!parsed.success) return null
      const ans = ctx.player.answers?.[phase.id]
      return template.scorer({
        config: parsed.data,
        answer: ans?.value,
        answerSubmittedAt: ans?.submittedAt,
        phaseStartMs: ctx.phaseStartMs,
      })
    }
    // Quiz / other scored types: read from ctx.player.answers[qId] and compare
    // against the phase content's answer key when the resolver ships.
    default:
      return null
  }
}

export async function flushPhaseResults(sessionId: string, phase: Phase): Promise<void> {
  // Quiz phases: scores were already written per-question to aggregates/ by
  // the host during the quiz. Persist them as durable results directly.
  if (phase.content.type === 'quiz' && phase.content.mode === 'central_prompt') {
    await flushQuizFromAggregates(sessionId, phase)
    return
  }

  const [playersSnap, teamsSnap, pointerSnap] = await Promise.all([
    get(ref(rtdb, `sessions/${sessionId}/players`)),
    get(ref(rtdb, `sessions/${sessionId}/teams`)),
    get(ref(rtdb, `sessions/${sessionId}/phasePointer`)),
  ])
  const players = (playersSnap.val() ?? {}) as Record<string, PlayerLiveNode>
  const teams = (teamsSnap.val() ?? {}) as Record<string, TeamNode>
  const phaseStartMs = (pointerSnap.val()?.changedAt as number | undefined) ?? Date.now()

  const now = Date.now()
  const phaseDurationMs = (phase.timer?.seconds ?? 0) * 1000
  const contribs: Contribution[] = []
  for (const [playerId, p] of Object.entries(players)) {
    if (!p) continue
    const team = p.teamId ? teams[p.teamId] : undefined
    const signal = resolveCorrectness(phase, {
      playerId,
      teamId: p.teamId,
      player: p,
      team,
      phaseStartMs,
    })
    const answers = extractAnswersForPhase(p.answers)
    const score = signal
      ? scorePhase(phase, {
          correct: signal.correct,
          answered: signal.answered,
          elapsedMs: signal.elapsedMs,
          phaseDurationMs,
        })
      : 0
    contribs.push({
      playerId,
      teamId: p.teamId,
      isLeader: p.teamId ? teams[p.teamId]?.ownerPlayerId === playerId : false,
      score,
      answers,
      completedAt: now,
    })
  }

  const { keyBy, results } = aggregateForPhase(phase, contribs)

  // Durable per-key result node in RTDB. Merge-friendly via update() so multiple
  // phase-flushes accumulate onto the same result subtree.
  const collection = keyBy === 'playerId' ? 'results' : 'teamResults'
  const durablePatch: Record<string, unknown> = {}
  for (const [keyId, phaseResult] of Object.entries(results)) {
    durablePatch[`${collection}/${keyId}/${keyBy}`] = keyId
    durablePatch[`${collection}/${keyId}/sessionId`] = sessionId
    durablePatch[`${collection}/${keyId}/phaseResults/${phase.id}`] = {
      ...phaseResult,
      completedAt: serverTimestamp(),
    }
  }
  if (Object.keys(durablePatch).length > 0) {
    await update(ref(rtdb, `sessions/${sessionId}`), durablePatch)
  }

  // Live aggregate map — same store, different subtree. Accumulates ACROSS
  // phases: each flush adds the current phase's score to the prior total, so a
  // later phase with score=0 (microlearning, idle) does not wipe an earlier
  // scoring phase's contribution. Safe because flushPhaseResults runs exactly
  // once per phase transition (sequence: nextPhase; modular: endLevel — cards
  // disable after played so no replay).
  //
  // Boundary-only for pilot; for a live leaderboard, add per-submit tx on
  // aggregates/scores|teamScores.
  const aggKey = keyBy === 'playerId' ? 'scores' : 'teamScores'
  const priorSnap = await get(ref(rtdb, `sessions/${sessionId}/aggregates/${aggKey}`))
  const prior = (priorSnap.val() ?? {}) as Record<string, number>
  const patch: Record<string, number> = {}
  for (const [keyId, r] of Object.entries(results)) {
    if (typeof r.score === 'number') {
      patch[`${aggKey}/${keyId}`] = (prior[keyId] ?? 0) + r.score
    }
  }
  if (Object.keys(patch).length > 0) {
    await update(ref(rtdb, `sessions/${sessionId}/aggregates`), patch)
  }
}

// Answers written by submitAnswer land at players/{id}/answers/{qId}. Question
// ids are per-phase but the current pilot has no per-phase namespace; when quiz
// phases ship, prefix qIds with phaseId so this filter is exact.
function extractAnswersForPhase(
  answers: Record<string, { value: unknown }> | undefined
): Record<string, unknown> | undefined {
  if (!answers) return undefined
  const out: Record<string, unknown> = {}
  for (const [qId, a] of Object.entries(answers)) out[qId] = a?.value
  return Object.keys(out).length ? out : undefined
}

// Quiz flush: read the already-computed scores from aggregates/ and persist as
// durable results. No re-scoring — the host scored each question on reveal.
async function flushQuizFromAggregates(sessionId: string, phase: Phase): Promise<void> {
  const isTeam = phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  const aggKey = isTeam ? 'teamScores' : 'scores'
  const collection = isTeam ? 'teamResults' : 'results'
  const keyBy = isTeam ? 'teamId' : 'playerId'

  const scoresSnap = await get(ref(rtdb, `sessions/${sessionId}/aggregates/${aggKey}`))
  const scores = (scoresSnap.val() ?? {}) as Record<string, number>

  const durablePatch: Record<string, unknown> = {}
  for (const [keyId, score] of Object.entries(scores)) {
    durablePatch[`${collection}/${keyId}/${keyBy}`] = keyId
    durablePatch[`${collection}/${keyId}/sessionId`] = sessionId
    durablePatch[`${collection}/${keyId}/phaseResults/${phase.id}`] = {
      score,
      completedAt: serverTimestamp(),
    }
  }
  if (Object.keys(durablePatch).length > 0) {
    await update(ref(rtdb, `sessions/${sessionId}`), durablePatch)
  }
}
