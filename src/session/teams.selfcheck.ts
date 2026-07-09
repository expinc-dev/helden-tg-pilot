// Runnable self-check for the pure roster rule. No test runner / node types:
//   npx tsx src/session/teams.selfcheck.ts
// Excluded from the app build (tsconfig.app.json).
import { addMember } from './teamroster'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: unknown, b: unknown, msg: string) => ok(JSON.stringify(a) === JSON.stringify(b), msg)

// empty roster, cap 3 → first member added
eq(addMember(null, 'owner', 3), ['owner'], 'first member added')

// under cap → new member appended
eq(addMember(['owner'], 'm2', 3), ['owner', 'm2'], 'second member added')

// full (length == max) → join rejected (abort)
ok(addMember(['owner', 'm2', 'm3'], 'm4', 3) === undefined, 'N+1 rejected when full')

// idempotent: existing member re-adding (reconnect / re-scan) is a no-op, even when full
eq(addMember(['owner', 'm2', 'm3'], 'm2', 3), ['owner', 'm2', 'm3'], 'existing member no-op')

console.log('teams.selfcheck: OK')
