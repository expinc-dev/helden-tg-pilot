// Runnable self-check for the answered-strip maths.
//   npx tsx checks/phases/quiz/counts.selfcheck.ts
import { quizCounts } from '../../../src/phases/Quiz/counts'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: unknown, b: unknown, msg: string) => ok(JSON.stringify(a) === JSON.stringify(b), msg)

// More answers than players known -> the strip never shows "3 dari 2".
eq(
  quizCounts({ answered: 3, joined: 2, teams: 0 }),
  { answered: 3, total: 3, unit: 'pemain' },
  'answered > joined is clamped'
)
// 4 joined (2 of them AFK) -> total is 4, not the 2 that are online.
eq(
  quizCounts({ answered: 3, joined: 4, teams: 0 }),
  { answered: 3, total: 4, unit: 'pemain' },
  'AFK players stay in the denominator'
)
// team_collaborative: every member answers; the aggregate only ticks per team, so
// the strip counts players from their own answer nodes (5 of 12 here).
eq(
  quizCounts({
    answered: 2,
    answeredPlayers: 5,
    joined: 12,
    teams: 3,
    teamMode: 'team_collaborative',
  }),
  { answered: 5, total: 12, unit: 'pemain' },
  'collaborative counts players'
)
eq(
  quizCounts({
    answered: 1,
    answeredPlayers: 3,
    joined: 2,
    teams: 2,
    teamMode: 'team_collaborative',
  }),
  { answered: 3, total: 3, unit: 'pemain' },
  'collaborative is clamped too'
)
// team_leader_only: only the leader acts -> teams.
eq(
  quizCounts({ answered: 1, joined: 6, teams: 2, teamMode: 'team_leader_only' }),
  { answered: 1, total: 2, unit: 'tim' },
  'leader-only counts teams'
)
// Team mode with no teams (Single Player session) falls back to players.
eq(
  quizCounts({ answered: 1, joined: 3, teams: 0, teamMode: 'team_collaborative' }),
  { answered: 1, total: 3, unit: 'pemain' },
  'no teams -> players'
)
// Individual mode ignores teams.
eq(
  quizCounts({ answered: 0, joined: 5, teams: 2, teamMode: 'individual' }),
  { answered: 0, total: 5, unit: 'pemain' },
  'individual ignores teams'
)

console.log('counts.selfcheck: OK')
