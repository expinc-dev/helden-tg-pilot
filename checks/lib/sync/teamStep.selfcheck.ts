// Runnable self-check for the pure step-target rule:
//   npx tsx src/sync/teamStep.selfcheck.ts
// Excluded from the app build (tsconfig.app.json).
import { resolveStepTarget } from '../../../src/lib/sync/teamStep'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: unknown, b: unknown, msg: string) => ok(JSON.stringify(a) === JSON.stringify(b), msg)

// solo (no team / individual teamMode) -> reads/writes own step, unaffected
eq(
  resolveStepTarget('p1', 'solo', undefined, undefined),
  { targetPlayerId: 'p1', canWrite: true },
  'solo targets self'
)

// leader -> reads/writes own step too (leader's step IS the team's step),
// regardless of which team mode is active
eq(
  resolveStepTarget('p1', 'leader', 'p1', 'team_leader_only'),
  { targetPlayerId: 'p1', canWrite: true },
  'leader targets self'
)

// member in team_leader_only -> mirrors the leader's step, read-only (own
// selfStep node ignored) — only the leader acts in this mode
eq(
  resolveStepTarget('p2', 'member', 'p1', 'team_leader_only'),
  { targetPlayerId: 'p1', canWrite: false },
  'team_leader_only member targets leader, read-only'
)

// member in team_leader_only with unresolved leader (team owner not loaded
// yet) -> no target, no write
eq(
  resolveStepTarget('p2', 'member', undefined, 'team_leader_only'),
  { targetPlayerId: undefined, canWrite: false },
  'member with unknown leader has no target'
)

// member in team_collaborative -> everyone participates, so this device still
// targets ITS OWN step, not the leader's. Only score/result attribution keys
// by teamId here (tg-schema), not stepping.
eq(
  resolveStepTarget('p2', 'member', 'p1', 'team_collaborative'),
  { targetPlayerId: 'p2', canWrite: true },
  'team_collaborative member targets self, not the leader'
)

console.log('teamStep.selfcheck: OK')
