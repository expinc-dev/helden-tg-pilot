// Runnable self-check for the host advance gate. No test runner:
//   npx tsx checks/lib/session/advanceGate.selfcheck.ts
// Pure module only (src/lib/session/advanceGate.ts has no imports).
import {
  ADVANCE_DWELL_MS,
  ADVANCE_STALE_MS,
  createAdvanceGate,
} from '../../../src/lib/session/advanceGate'

function eq(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error(`FAIL ${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`)
    process.exit(1)
  }
}

function setup() {
  let t = 1_000_000
  const gate = createAdvanceGate({ now: () => t })
  return { gate, tick: (ms: number) => (t += ms) }
}

// tryStart → a token, or null when refused.
const started = (token: number | null) => token !== null

// ── Fresh page: first observation is a baseline, not a transition ───────────
{
  const { gate } = setup()
  gate.observe('1C')
  eq(gate.locked(), false, 'no dwell on the first observation')
  eq(started(gate.tryStart('1C', 'manual')), true, 'first advance allowed')
}

// ── One advance at a time, for ANY phase (the QA mash-through) ──────────────
{
  const { gate, tick } = setup()
  gate.observe('1C')
  const t1 = gate.tryStart('1C')
  eq(started(t1), true, 'start 1C')
  tick(300)
  eq(gate.tryStart('1C'), null, 'same phase again while in flight')
  eq(gate.tryStart('1D'), null, 'a different phase while 1C is in flight')
  eq(gate.busy(), true, 'busy while in flight')
  eq(gate.locked(), true, 'locked while in flight')

  // The pointer is seen on 1D — but nextPhase has NOT settled yet (Firebase fires
  // the local listener at write time, before openPhase finishes): still busy.
  tick(6_800)
  gate.observe('1D')
  eq(gate.busy(), true, 'seeing the pointer move does not end the advance')
  eq(gate.tryStart('1D', 'manual'), null, 'no new advance while the old one still settles')
  eq(gate.tryStart('1D', 'auto'), null, 'not even an auto one')

  // nextPhase settles: this is when the host can first SEE 1D, so the dwell
  // starts now — not when the pointer changed 2s earlier.
  tick(2_000)
  gate.release(t1!)
  eq(gate.busy(), false, 'settling releases the gate')
  eq(gate.dwellRemaining(), ADVANCE_DWELL_MS, 'dwell counts from when the phase became visible')
  eq(gate.tryStart('1D', 'manual'), null, 'tap right as the new screen appears is dropped')
  eq(gate.locked(), true, 'locked during dwell')

  tick(ADVANCE_DWELL_MS - 1)
  eq(gate.tryStart('1D', 'manual'), null, 'still inside the dwell')
  tick(1)
  eq(gate.locked(), false, 'unlocked once the dwell has passed')
  eq(started(gate.tryStart('1D', 'manual')), true, 'deliberate advance after the dwell works')
}

// ── The 2s-RTT "bot" case that slipped through once: 330ms on 1D ────────────
{
  const { gate, tick } = setup()
  gate.observe('1C')
  const t1 = gate.tryStart('1C')!
  tick(3_000)
  gate.observe('1D') // pointer lands…
  tick(2_030) // …openPhase still settling, host sees "moving…"
  gate.release(t1)
  tick(330) // eager second tap right after the overlay goes away
  eq(gate.tryStart('1D', 'manual'), null, 'a tap 330ms after 1D appears is refused')
  tick(ADVANCE_DWELL_MS - 330)
  eq(started(gate.tryStart('1D', 'manual')), true, 'allowed once 1D has been visible for the dwell')
}

// ── A failed advance (pointer never moved) does not start a dwell ───────────
{
  const { gate } = setup()
  gate.observe('1C')
  const t1 = gate.tryStart('1C')!
  gate.release(t1)
  eq(gate.dwellRemaining(), 0, 'no dwell after a failure that left the phase unchanged')
  eq(started(gate.tryStart('1C')), true, 'host can retry immediately')
}

// ── Auto-advance is never dropped by the dwell, but is still one-at-a-time ──
{
  const { gate, tick } = setup()
  gate.observe('A')
  const tA = gate.tryStart('A')!
  gate.observe('B')
  gate.release(tA)
  eq(started(gate.tryStart('B', 'auto')), true, 'auto skips the dwell')
  tick(10)
  eq(gate.tryStart('B', 'manual'), null, 'but a manual tap during that advance waits')
  eq(gate.tryStart('B', 'auto'), null, 'and a second auto does too')
}

// ── A caller on a stale screen is refused ───────────────────────────────────
{
  const { gate } = setup()
  gate.observe('1D')
  eq(gate.tryStart('1C', 'manual'), null, 'caller from an older phase')
  eq(gate.tryStart('1C', 'auto'), null, 'stale auto caller too')
  eq(started(gate.tryStart('1D', 'manual')), true, 'caller on the live phase')
}

// ── Tokens: only the owning advance may release ─────────────────────────────
{
  const { gate, tick } = setup()
  gate.observe('1C')
  const t1 = gate.tryStart('1C')!
  gate.release(t1)
  eq(gate.busy(), false, 'own settle releases')
  const t2 = gate.tryStart('1C')!
  eq(t2 !== t1, true, 'each advance gets its own token')
  gate.release(t1)
  eq(
    gate.busy(),
    true,
    'a duplicate/late settle with the OLD token does not release the new advance'
  )
  gate.release(t2)
  eq(gate.busy(), false, 'the owner releases its own')

  // Same-phase hazard: a hung advance goes stale, the host retries (new token),
  // then the hung one finally settles. It must not unlock the retry.
  gate.observe('1D')
  tick(ADVANCE_DWELL_MS)
  const hung = gate.tryStart('1D', 'manual')!
  tick(ADVANCE_STALE_MS)
  eq(gate.busy(), false, 'hung advance stops counting after the stale limit')
  const retry = gate.tryStart('1D', 'manual')!
  gate.release(hung)
  eq(gate.busy(), true, 'the hung advance settling late does not unlock the retry (same phase)')
  gate.release(retry)
  eq(gate.busy(), false, 'retry releases itself')
}

// ── A hung advance cannot lock the host out forever ─────────────────────────
{
  const { gate, tick } = setup()
  gate.observe('1C')
  gate.tryStart('1C')
  tick(ADVANCE_STALE_MS - 1)
  eq(gate.busy(), true, 'still busy just before the stale limit')
  tick(1)
  eq(gate.busy(), false, 'stale in-flight advance stops counting')
  eq(started(gate.tryStart('1C')), true, 'host can retry after the stale limit')
}

// ── nextCheckInMs: what the UI timer needs to re-arm on ─────────────────────
{
  const { gate, tick } = setup()
  gate.observe('A')
  eq(gate.nextCheckInMs(), null, 'nothing pending on a fresh gate')
  const t1 = gate.tryStart('A')!
  eq(gate.nextCheckInMs(), ADVANCE_STALE_MS, 'in flight: re-check when it would go stale')
  tick(5_000)
  eq(gate.nextCheckInMs(), ADVANCE_STALE_MS - 5_000, 'counts down')
  gate.observe('B')
  gate.release(t1)
  eq(gate.nextCheckInMs(), ADVANCE_DWELL_MS, 'after settling: re-check when the dwell ends')

  // A SECOND pointer change inside the dwell restarts it — the earlier timer
  // would see a still-locked gate, so the answer must move out to the new end.
  tick(1_000)
  gate.observe('C')
  eq(gate.nextCheckInMs(), ADVANCE_DWELL_MS, 'second pointer change restarts the dwell')
  tick(ADVANCE_DWELL_MS)
  eq(gate.nextCheckInMs(), null, 'nothing pending once the dwell has ended')
  eq(gate.locked(), false, 'and the gate is unlocked')
}

// ── Observing the same phase again changes nothing ──────────────────────────
{
  const { gate } = setup()
  gate.observe('1C')
  gate.tryStart('1C')
  gate.observe('1C')
  gate.observe(undefined)
  eq(gate.busy(), true, 'same phase / undefined observations keep the advance in flight')
  eq(gate.dwellRemaining(), 0, 'and start no dwell')
}

console.log('advanceGate.selfcheck: OK')
