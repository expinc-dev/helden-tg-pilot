// Pure "n dari m" maths for the answered strips (host + central). No Firebase —
// `checks/phases/quiz/counts.selfcheck.ts` runs it under plain `npx tsx`.
//
// What is counted depends on who actually acts in the phase:
//  - individual (or a team phase in a session without teams): every player
//    answers → players, numerator = aggregate answeredCount.
//  - team_leader_only: only the leader acts → teams, numerator = answeredCount
//    (answeredBy/{teamId}, one tick per team).
//  - team_collaborative: EVERY member answers and the majority decides, but the
//    aggregate counter only ticks once per team (answeredBy/{teamId} rejects the
//    second member and rolls the whole update back) — so players are counted
//    from their own answer nodes instead (`answeredPlayers`).
// The denominator is everyone who JOINED (a sleeping phone is still in the room),
// in the numerator's unit, and never smaller than the numerator — the strip can
// never read "3 dari 2".

export type CountUnit = 'pemain' | 'tim'

export function quizCounts(o: {
  /** aggregates/answeredCount for the question. */
  answered: number
  /** Players that have an answer node for the question. */
  answeredPlayers?: number
  joined: number
  teams: number
  teamMode?: string
}): { answered: number; total: number; unit: CountUnit } {
  const hasTeams = o.teams > 0
  if (o.teamMode === 'team_leader_only' && hasTeams) {
    return { answered: o.answered, total: Math.max(o.teams, o.answered), unit: 'tim' }
  }
  if (o.teamMode === 'team_collaborative' && hasTeams) {
    const answered = o.answeredPlayers ?? o.answered
    return { answered, total: Math.max(o.joined, answered), unit: 'pemain' }
  }
  return { answered: o.answered, total: Math.max(o.joined, o.answered), unit: 'pemain' }
}
