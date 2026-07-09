// Runnable self-check for the pure capacity rule. No test runner needed:
//   npx tsx src/session/presence.selfcheck.ts
// Excluded from the app build (see tsconfig.app.json). Imports capacity.ts only,
// so it pulls in no Firebase / env / node types.
import { reserveSlot } from './capacity'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: unknown, b: unknown, msg: string) => ok(JSON.stringify(a) === JSON.stringify(b), msg)

// empty session, cap 2 → first join reserves a slot
eq(reserveSlot(null, 'a', 2), { a: { connected: true } }, 'first join reserves')

// one connected member, cap 2 → second distinct join allowed
eq(
  reserveSlot({ a: { connected: true } }, 'b', 2),
  { a: { connected: true }, b: { connected: true } },
  'second join allowed'
)

// full (2 connected, cap 2) → N+1 join rejected (abort)
const full = { a: { connected: true }, b: { connected: true } }
ok(reserveSlot(full, 'c', 2) === undefined, 'N+1 rejected when full')

// rejoin of existing id never consumes a slot, even when full
eq(reserveSlot(full, 'a', 2), full, 'rejoin does not consume a slot')

// disconnected slot is reclaimable: 1 connected + 1 disconnected, cap 2 → allowed
const withDead = { a: { connected: true }, b: { connected: false } }
ok(reserveSlot(withDead, 'c', 2)?.c?.connected === true, 'disconnected slot reclaimable')

console.log('presence.selfcheck: OK')
