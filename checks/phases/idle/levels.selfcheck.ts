// Runnable self-check for the Select Level grouping. No test runner:
//   npx tsx checks/phases/idle/levels.selfcheck.ts
// Pure module only (src/phases/Idle/levels.ts has no imports).
import { groupLevels, levelProgressPct, levelSelectGroups } from '../../../src/phases/Idle/levels'

function eq(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error(`FAIL ${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`)
    process.exit(1)
  }
}

// Titles/types copied from the TestFull-V2 publish, with an idle (the Select
// Level screen) authored right after 1D.
const rows: [string, string, string][] = [
  ['v1a', 'video', '1a — Video Pembuka: “Bu Sari”'],
  ['a', 'quiz', 'Level 1A: Pernyataan Sikap'],
  ['b', 'presentation', 'Level 1B: Kekacauan Terparah'],
  ['c', 'quiz', 'Level 1C: Kuis Mitos AI'],
  ['d', 'microlearning', 'Level 1D: Tanam Benih'],
  ['sel', 'idle', 'Pilih Level'],
  ['v2', 'video', 'L2-1 Video Pembuka'],
  ['gem', 'microlearning', 'Level 2: Gemini'],
  ['2a', 'minigame', 'Level 2A: Analisis'],
  ['2e', 'reflection', 'Level 2E: Refleksi'],
  ['v3', 'video', 'L3-0 Video Jembatan'],
  ['3a', 'quiz', 'Level 3A: Keaslian'],
  ['3c', 'quiz', 'Level 3C: Kehadiran'],
  ['v4', 'video', 'L4-0 Video Giliranmu'],
  ['4b', 'minigame', 'Level 4B: Build & Run'],
  ['cl1', 'minigame', 'Closing 1 — Komitmen'],
  ['cl3', 'minigame', 'Closing 3 — Selfie Tim'],
  ['end', 'end', 'Selesai L4'],
]
const order = rows.map(([id]) => id)
const phases = Object.fromEntries(rows.map(([id, type, title]) => [id, { id, type, title }]))
const level1 = { v1a: true, a: true, b: true, c: true, d: true } as const

// Every level of the game, in order (including Level 1 BEFORE the idle); first
// phase = jump target; end/idle excluded.
const levels = levelSelectGroups(order, phases, 'sel', {})
eq(
  levels.map((l) => [l.label, l.id, l.phaseIds.length]),
  [
    ['Level 1', 'v1a', 5],
    ['Level 2', 'v2', 4],
    ['Level 3', 'v3', 3],
    ['Level 4', 'v4', 2],
    ['Closing', 'cl1', 2],
  ],
  'all levels'
)

// Progressive: nothing played → the first level is the only open one.
eq(
  levels.map((l) => l.status),
  ['available', 'locked', 'locked', 'locked', 'locked'],
  'fresh'
)

// Level 1 finished (we reached the idle) → done, Level 2 is next, rest locked.
const afterL1 = levelSelectGroups(order, phases, 'sel', level1)
eq(
  afterL1.map((l) => l.status),
  ['done', 'available', 'locked', 'locked', 'locked'],
  'after L1'
)
// A level counts as done only when EVERY one of its phases is played.
const partial = levelSelectGroups(order, phases, 'sel', { ...level1, v2: true, gem: true })
eq(
  partial.map((l) => l.status),
  ['done', 'available', 'locked', 'locked', 'locked'],
  'partial L2'
)
const l2done = levelSelectGroups(order, phases, 'sel', {
  ...level1,
  v2: true,
  gem: true,
  '2a': true,
  '2e': true,
})
eq(
  l2done.map((l) => l.status),
  ['done', 'done', 'available', 'locked', 'locked'],
  'L2 done'
)

// Progress = played phases / all level phases (5 of 16 after Level 1).
eq(levelProgressPct(levels), 0, 'pct fresh')
eq(levelProgressPct(afterL1), 31, 'pct after L1')
eq(levelProgressPct([]), 0, 'pct empty')

// Idle in first position (waiting room) or an unknown id → not a select screen.
eq(
  levelSelectGroups(['sel', 'v2'], { sel: phases.sel, v2: phases.v2 }, 'sel', {}),
  [],
  'idle first'
)
eq(groupLevels(order, phases, 'nope', {}), [], 'unknown "after" id')
// Idle with no level anywhere → empty, caller falls back to roster idle.
eq(
  levelSelectGroups(
    ['x', 'sel', 'end'],
    { x: { id: 'x', type: 'idle' }, sel: phases.sel, end: phases.end },
    'sel',
    {}
  ),
  [],
  'no levels'
)

// Untitled follow-up joins the previous level; a bare "L5A" is not a level prefix.
const odd = {
  x: { id: 'x', type: 'idle', title: 'Pilih' },
  p: { id: 'p', type: 'quiz', title: 'Level 5A: Foo' },
  q: { id: 'q', type: 'quiz', title: 'Bonus' },
  r: { id: 'r', type: 'quiz', title: 'L5A odd' },
}
const g = groupLevels(['a0', 'x', 'p', 'q', 'r'], { a0: phases.a, ...odd }, 'x', {})
eq(
  g.map((l) => [l.label, l.phaseIds]),
  [['Level 5', ['p', 'q', 'r']]],
  'unprefixed phases join previous'
)
// With nothing before it, an unprefixed phase stands alone under its own title.
const lone = groupLevels(['x', 'q', 'p'], { x: odd.x, q: odd.q, p: odd.p }, 'x', {})
eq(
  lone.map((l) => l.label),
  ['Bonus', 'Level 5'],
  'leading unprefixed phase stands alone'
)
// The card label is always the level's own label, never a phase title — even for
// a level made only of one video.
const vids = groupLevels(
  ['v'],
  { v: { id: 'v', type: 'video', title: 'L9-0 Video' } },
  undefined,
  {}
)
eq(
  vids.map((l) => l.label),
  ['Level 9'],
  'label is the level, not a phase title'
)

console.log('levels.selfcheck: OK')
