// Runnable self-check for the scale ("attitude" quiz) helpers (HLN-012).
// Pure functions — no Firebase/React.
//   npx tsx checks/phases/quiz/scale.selfcheck.ts
//
// IMPORTANT: the first block mirrors the REAL production wire format. The
// player submits { value: <number>, optionId: scaleOptionId(value) } and
// lib/sync/submitAnswer writes value to players/{id}/answers/{qId}.value and
// update(aggregates, { distribution/{qId}/{optionId}: increment(1) }). RTDB
// object keys are strings, so the number the player tapped must come back out
// of the distribution as its string form — that is the contract L3 reads. A
// regression here would silently drop every answer into a bucket keyed
// differently from what the debrief expects.
import { isScaleQuestion, scaleOptionId, scalePoints } from '../../../src/phases/Quiz/scale'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

const attitude = {
  qType: 'scale',
  prompt: [],
  min: 1,
  max: 4,
  labels: ['Helemaal oneens', 'Helemaal eens'],
}

// ── PRODUCTION WIRE FORMAT ──────────────────────────────────────────────────
// Exactly what handleScaleAnswer in Quiz/player/index.tsx sends: the point
// value plus its string form as the aggregate bucket key.
{
  const tapped = 3
  const optionId = scaleOptionId(tapped)
  ok(optionId === '3', `bucket key for the tapped point 3 → '3' (got ${JSON.stringify(optionId)})`)

  // Round-trip through the RTDB update payload shape.
  const distribution: Record<string, number> = {}
  distribution[optionId] = (distribution[optionId] ?? 0) + 1
  const echoed = JSON.parse(JSON.stringify({ distribution })).distribution as Record<string, number>
  ok(Object.keys(echoed)[0] === '3', 'distribution round-trips as the string key 3')
  ok(echoed['3'] === 1, 'distribution bucket holds the increment count')
  ok(
    scaleOptionId(1) === '1' && scaleOptionId(4) === '4',
    'lower/upper bounds of the 4-point scale'
  )
}

// ── scalePoints ─────────────────────────────────────────────────────────────
{
  ok(
    JSON.stringify(scalePoints(attitude)) === JSON.stringify([1, 2, 3, 4]),
    '4-point attitude scale → 1..4'
  )
  ok(scalePoints(attitude).length % 2 === 0, 'attitude scale has no neutral midpoint')

  ok(
    JSON.stringify(scalePoints({ ...attitude, min: 0, max: 10 })) ===
      JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    'wide-but-sane range still expands'
  )
  ok(
    JSON.stringify(scalePoints({ ...attitude, min: -2, max: 2 })) ===
      JSON.stringify([-2, -1, 0, 1, 2]),
    'negative min expands'
  )

  // Degenerate / hand-edited documents must collapse, never render forever or throw.
  ok(scalePoints({ ...attitude, min: 3, max: 3 }).length === 0, 'max === min → no points')
  ok(scalePoints({ ...attitude, min: 4, max: 1 }).length === 0, 'max < min → no points')
  ok(scalePoints({ ...attitude, min: 1, max: 1000 }).length === 0, 'pathological range → no points')
  // The cap is exactly 20 points: min..min+20 expands, one more collapses.
  ok(scalePoints({ ...attitude, min: 1, max: 21 }).length === 21, 'range of exactly 20 → expands')
  ok(scalePoints({ ...attitude, min: 1, max: 22 }).length === 0, 'range of 21 → no points')
  ok(scalePoints({ ...attitude, min: 1.5, max: 4 }).length === 0, 'non-integer min → no points')
  ok(scalePoints({ ...attitude, min: 1, max: 4.5 }).length === 0, 'non-integer max → no points')
}

// ── isScaleQuestion ─────────────────────────────────────────────────────────
{
  ok(isScaleQuestion(attitude) === true, 'scale question narrows')
  ok(isScaleQuestion({ qType: 'single_choice' }) === false, 'choice question does not narrow')
  ok(isScaleQuestion({ qType: 'path_question' }) === false, 'path_question does not narrow')
}

console.log('scale.selfcheck: OK')
