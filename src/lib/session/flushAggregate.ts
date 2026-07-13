import type { Phase, PhaseResult } from '@helden-inc/tg-schema'

// Pure route + aggregate for durable phase results. Given a Phase and per-player
// scored contributions, produce the { keyBy, results } payload keyed correctly
// for the Phase's teamMode. Zero Firebase, zero side effects — the Firebase
// glue lives in flush.ts.
//
// individual         → results keyed by playerId, passthrough.
// team_leader_only   → results keyed by teamId, ONLY the leader's contribution
//                      counts (member contributions are dropped, since only the
//                      leader acts in this mode).
// team_collaborative → results keyed by teamId, contributions SUMMED per team,
//                      answers MERGED (last-write-wins per qId).
//
// AC: durable results written per teamId in team modes; scoring keys by
// playerId (individual) or teamId (team modes).

export interface Contribution {
  playerId: string
  teamId?: string // required in team modes; missing → contribution is dropped
  isLeader?: boolean // used only in team_leader_only
  score: number
  answers?: Record<string, unknown>
  completedAt?: number
}

export interface FlushPayload {
  keyBy: 'playerId' | 'teamId'
  results: Record<string, PhaseResult>
}

function isTeamMode(phase: Phase): boolean {
  return phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
}

export function aggregateForPhase(phase: Phase, contributions: Contribution[]): FlushPayload {
  if (!isTeamMode(phase)) {
    const results: Record<string, PhaseResult> = {}
    for (const c of contributions) {
      results[c.playerId] = {
        score: c.score,
        answers: c.answers,
        completedAt: c.completedAt,
      }
    }
    return { keyBy: 'playerId', results }
  }

  const results: Record<string, PhaseResult> = {}
  for (const c of contributions) {
    if (!c.teamId) continue // team mode requires teamId; unassigned devices drop
    if (phase.teamMode === 'team_leader_only' && !c.isLeader) continue
    const prev = results[c.teamId] ?? {}
    results[c.teamId] = {
      score: (prev.score ?? 0) + c.score,
      answers: { ...(prev.answers ?? {}), ...(c.answers ?? {}) },
      // Latest completedAt across teammates — the phase is "done for the team"
      // when the last contributing member finished.
      completedAt: Math.max((prev.completedAt as number) ?? 0, c.completedAt ?? 0) || undefined,
    }
  }
  return { keyBy: 'teamId', results }
}
