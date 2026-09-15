// Runnable self-check for the doubt_seed scorer (HLN-006). Pure function — no
// Firebase/React. Doubt-seed is a reflection activity: many valid arrangements,
// no "correct" answer, so the scorer only reports whether the player filled
// every slot and ALWAYS returns correct:false (no points accrue).
//   npx tsx checks/phases/minigames/doubt_seed.selfcheck.ts
import { scoreDoubtSeed } from '../../../src/phases/Minigames/DoubtSeed/score'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

// Minimal config satisfying the DoubtSeedConfig type.
const config = {
  soulCards: [
    { id: 's1', text: 'Soul 1' },
    { id: 's2', text: 'Soul 2' },
  ],
  distractorCards: [{ id: 'd1', text: 'Distractor 1' }],
  dropZones: 2,
  instructions: 'Drag your cards.',
}
const phaseStartMs = 1_000_000

// All slots filled → answered=true, but still correct=false (reflection, no scoring).
{
  const r = scoreDoubtSeed({ config, answer: ['s1', 'd1'], phaseStartMs })
  ok(r.answered === true, 'all slots filled → answered')
  ok(r.correct === false, 'reflection → never correct')
  ok(r.elapsedMs === 0, 'no elapsed tracking → 0')
}

// A different arrangement (distractor in first slot) → still answered, still not correct.
{
  const r = scoreDoubtSeed({ config, answer: ['d1', 's2'], phaseStartMs })
  ok(r.answered === true, 'any full arrangement → answered')
  ok(r.correct === false, 'any arrangement → never correct')
}

// Partial (fewer entries than dropZones) → answered=false.
{
  const r = scoreDoubtSeed({ config, answer: ['s1'], phaseStartMs })
  ok(r.answered === false, 'partial fill → not answered')
}

// Array length matches but one entry is falsy (null/missing) → answered=false.
{
  const r = scoreDoubtSeed({ config, answer: ['s1', null], phaseStartMs })
  ok(r.answered === false, 'falsy entry → not answered')
}

// Extra entries beyond dropZones → answered=false (length must match exactly).
{
  const r = scoreDoubtSeed({ config, answer: ['s1', 'd1', 's2'], phaseStartMs })
  ok(r.answered === false, 'extra entries → not answered')
}

// Not an array (no submit / garbage) → answered=false, correct=false.
{
  const r = scoreDoubtSeed({ config, answer: undefined, phaseStartMs })
  ok(r.answered === false && r.correct === false, 'no submit → 0')
  ok(r.elapsedMs === 0, 'no submit → elapsed 0')
}

console.log('doubt_seed.selfcheck: OK')
