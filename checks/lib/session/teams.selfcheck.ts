// Runnable self-check for the pure roster rule. No test runner / node types:
//   npx tsx src/session/teams.selfcheck.ts
// Excluded from the app build (tsconfig.app.json).
import { addMember } from '../../../src/lib/session/teamroster'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: unknown, b: unknown, msg: string) => ok(JSON.stringify(a) === JSON.stringify(b), msg)

// empty roster, cap 3 → first member added
eq(addMember(null, 'owner', 3), { owner: true }, 'first member added')

// under cap → new member appended
eq(addMember({ owner: true }, 'm2', 3), { owner: true, m2: true }, 'second member added')

// full (size == max) → join rejected (abort)
ok(addMember({ owner: true, m2: true, m3: true }, 'm4', 3) === undefined, 'N+1 rejected when full')

// idempotent: existing member re-adding (reconnect / re-scan) is a no-op, even when full
eq(
  addMember({ owner: true, m2: true, m3: true }, 'm2', 3),
  { owner: true, m2: true, m3: true },
  'existing member no-op'
)

console.log('teams.selfcheck: OK')
