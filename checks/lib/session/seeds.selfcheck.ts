// Runnable self-check for the seed read path (HLN-002). No test runner:
//   npx tsx checks/lib/session/seeds.selfcheck.ts
// Pure module only — src/lib/session/seeds.ts imports no Firebase, no React, no
// env, so this runs standalone and is excluded from the app build
// (tsconfig.app.json includes only "src").
//
// The contract under test is the qId convention the L4 surfaces will depend on:
// a seed is looked up by an RTDB key derived from AUTHORED phase/step ids, so a
// drift in either direction (a wrong join, a re-ordered block, an option id
// resolved to the wrong label) shows the participant an empty card or somebody
// else's category instead of their own words — silently, because both shapes
// are legal answers.
//
// The bundle below is a FIXTURE whose ids and labels are the shipped L1 1e ones
// (step 1 = the category's single_choice, step 2 = the open_text). It is built
// here rather than imported from src/lib/demoBundle.ts, because that file is
// author-editable content and it does NOT contain this phase in the CMS
// submodule copy — importing it wholesale would fail a check that has nothing to
// do with the seed logic. The fixture therefore asserts the CONVENTION (two
// steps, question as the SECOND block of each, category and text in different
// steps); keeping the ids in step with real content is the job of whoever
// authors the spec, i.e. HLN-005/HLN-014.
import type { PublishedGame } from '@helden-inc/tg-schema'

import {
  type SeedSpec,
  answerValue,
  buildSeeds,
  choiceLabel,
  mergeSeedAnswer,
  microQId,
  microSeedSpec,
  parseMicroQId,
  readSeedText,
  reflectionQId,
  reflectionSeedSpec,
  seedQIds,
} from '../../../src/lib/session/seeds'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: unknown, b: unknown, msg: string) =>
  ok(
    JSON.stringify(a) === JSON.stringify(b),
    `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`
  )

// ---------------------------------------------------------------------------
// qId construction — the format IS the contract with the writers.
// Mirrors phases/Microlearning/PlayerPane/index.tsx: `${phase.id}_${current.id}_${i}`
// ---------------------------------------------------------------------------

eq(microQId('P', 'S', 1), 'P_S_1', 'micro qId joins phase/step/index')
eq(microQId('P', 'S', 0), 'P_S_0', 'block index 0 is a real index')

// reflection's rule is the phase id alone, no underscore (phases/Reflection/lib.ts).
eq(reflectionQId('PHASE-ONLY'), 'PHASE-ONLY', 'reflection qId is the bare phaseId')

// microSeedSpec: no category → key absent, not an empty string (buildSeeds
// branches on `categoryQId === undefined`). Category and text are separate
// steps on purpose — that is how L1 1e is authored.
eq(
  microSeedSpec({ phaseId: 'P', seedStepId: 'S', seedBlockIndex: 1, source: 'L1_seed' }),
  { source: 'L1_seed', qId: 'P_S_1' },
  'spec without category'
)
eq(
  microSeedSpec({
    phaseId: 'P',
    seedStepId: 'S2',
    seedBlockIndex: 1,
    source: 'L1_seed',
    categoryStepId: 'S1',
    categoryBlockIndex: 0,
  }),
  { source: 'L1_seed', qId: 'P_S2_1', categoryQId: 'P_S1_0' },
  'spec with category in a different step'
)
// A half-specified category (a step but no index) must drop the category rather
// than emit a qId built from `undefined`.
eq(
  microSeedSpec({
    phaseId: 'P',
    seedStepId: 'S',
    seedBlockIndex: 1,
    source: 'L1_seed',
    categoryStepId: 'S1',
  }),
  { source: 'L1_seed', qId: 'P_S_1' },
  'category step without an index → no category key'
)
eq(
  reflectionSeedSpec('R', 'L2_reflection'),
  { source: 'L2_reflection', qId: 'R' },
  'reflection spec'
)

// ---------------------------------------------------------------------------
// parseMicroQId round-trips, and rejects what it cannot address.
// ---------------------------------------------------------------------------

eq(parseMicroQId('P_S_1'), { phaseId: 'P', stepId: 'S', blockIndex: 1 }, 'round-trip')
eq(
  parseMicroQId('a_b_c_12'),
  { phaseId: 'a_b', stepId: 'c', blockIndex: 12 },
  'splits on the LAST two underscores, so a step id containing _ survives'
)
eq(parseMicroQId('PHASE-ONLY'), undefined, 'no underscore → not a micro qId')
eq(parseMicroQId('P_S'), undefined, 'only one underscore → not a micro qId')
eq(parseMicroQId('P_S_x'), undefined, 'non-numeric tail → undefined, not NaN')
eq(parseMicroQId('P_S_-1'), undefined, 'negative index rejected')

// ---------------------------------------------------------------------------
// Answer unwrapping. Writers store { value, submittedAt } (submitAnswer), but
// every other reader in this repo applies `.value` itself, so a caller may hand
// over either — and the second unwrap of a plain value must be a no-op.
// ---------------------------------------------------------------------------

eq(answerValue({ value: 'x', submittedAt: 1 }), 'x', 'unwraps the stored answer node')
eq(answerValue('x'), 'x', 'a bare value passes through')
eq(answerValue({ text: 'x', scale: 3 }), { text: 'x', scale: 3 }, 'reflection value untouched')

// ---------------------------------------------------------------------------
// readSeedText — the two real answer shapes, plus the blanks that must NOT
// count as a seed (a whitespace-only answer has to degrade to the example).
// ---------------------------------------------------------------------------

eq(readSeedText('  hello  '), 'hello', 'micro open_text trims')
eq(readSeedText({ text: '  hi ', scale: 4 }), 'hi', 'reflection takes .text')
eq(readSeedText({ value: 'stored' }), 'stored', 'stored node unwrapped')
eq(readSeedText({ value: { text: 'r', scale: 2 } }), 'r', 'stored reflection node unwrapped')
eq(readSeedText(undefined), undefined, 'missing → undefined')
eq(readSeedText(null), undefined, 'null → undefined')
eq(readSeedText('   '), undefined, 'whitespace-only is not a seed')
eq(readSeedText({ text: '  ', scale: 3 }), undefined, 'blank reflection text is not a seed')
eq(readSeedText({ scale: 3 }), undefined, 'reflection with no text is not a seed')
eq(readSeedText(['a']), undefined, 'an array is not text')
ok(readSeedText(42) === undefined, 'a number is not text')

// ---------------------------------------------------------------------------
// The bundle fixture. Ids and labels are the shipped L1 1e ones; the structure
// is what matters (two steps, question second).
// ---------------------------------------------------------------------------

const L1_PHASE = '01a0c7b0-666f-77b1-9592-b394036528d1'
const L1_STEP1 = '01a0c93c-3b96-7446-998b-29f6310d7928'
const L1_STEP2 = '01a0c93e-4dd3-72b1-8d10-89aa24461e33'
const L1_OPT_CUSTOMER = '01a0c93d-4313-761a-b296-d676b1f053ef'
const L1_OPT_PROMO = '01a0c93d-56dc-778e-93ad-16b4c57a1606'
const L1_OPT_ADMIN = '01a0c93d-7624-743b-bba6-dc33870ab1ae'
const L1_OPT_OTHER = '01a0c93d-7a02-7438-b179-713d3b5d5fc1'
const L1_OPT_CUSTOMER_LABEL = 'Melayani pelanggan (balas chat, jawab pertanyaan yang sama terus)'
const L1_OPT_OTHER_LABEL = 'Lainnya (tulis sendiri)'

const bundle = {
  id: 'gv_fixture',
  gameId: 'evt_fixture',
  schemaVersion: '4.8.0',
  title: 'fixture',
  phaseOrder: [L1_PHASE],
  flowMode: 'sequential',
  phases: {
    [L1_PHASE]: {
      id: L1_PHASE,
      type: 'microlearning',
      title: '1e — Plant the Seed',
      syncMode: 'self_paced',
      roles: {},
      content: {
        type: 'microlearning',
        mode: 'sequential',
        steps: [
          {
            id: L1_STEP1,
            title: 'Bagian mana yang paling makan waktu?',
            blocks: [
              { kind: 'text', markdown: 'intro' },
              {
                kind: 'question',
                question: {
                  qType: 'single_choice',
                  prompt: [],
                  options: [
                    { id: L1_OPT_CUSTOMER, label: L1_OPT_CUSTOMER_LABEL },
                    {
                      id: L1_OPT_PROMO,
                      label:
                        'Promosi & konten (bikin caption, foto produk, deskripsi, sebar promo)',
                    },
                    {
                      id: L1_OPT_ADMIN,
                      label: 'Catatan & administrasi (hitung stok, catat pesanan, rekap)',
                    },
                    { id: L1_OPT_OTHER, label: L1_OPT_OTHER_LABEL },
                  ],
                },
              },
            ],
          },
          {
            id: L1_STEP2,
            title: 'Ceritakan sedikit',
            blocks: [
              { kind: 'text', markdown: 'intro' },
              { kind: 'question', question: { qType: 'open_text', prompt: [], maxLen: 300 } },
            ],
          },
        ],
      },
    },
  },
  publishedAt: 0,
  publishedBy: 'fixture',
} as unknown as PublishedGame

// The question is the SECOND block of each step (text first), which is exactly
// why blockIndex is a parameter and not a constant. Category and text live in
// DIFFERENT steps.
const l1Specs: SeedSpec[] = [
  microSeedSpec({
    phaseId: L1_PHASE,
    seedStepId: L1_STEP2,
    seedBlockIndex: 1,
    source: 'L1_seed',
    categoryStepId: L1_STEP1,
    categoryBlockIndex: 1,
  }),
]
const L1_CATEGORY_QID = `${L1_PHASE}_${L1_STEP1}_1`
const L1_TEXT_QID = `${L1_PHASE}_${L1_STEP2}_1`

eq(l1Specs[0].qId, L1_TEXT_QID, 'L1 seed text qId')
eq(l1Specs[0].categoryQId, L1_CATEGORY_QID, 'L1 seed category qId')

eq(
  choiceLabel(bundle, L1_CATEGORY_QID, L1_OPT_CUSTOMER),
  L1_OPT_CUSTOMER_LABEL,
  'category resolves the stored option UUID to its label'
)
eq(
  choiceLabel(bundle, L1_CATEGORY_QID, L1_OPT_OTHER),
  L1_OPT_OTHER_LABEL,
  'the free-form option resolves too — it stores the same UUID, with no text field'
)
eq(
  choiceLabel(bundle, L1_CATEGORY_QID, 'not-an-option'),
  undefined,
  'unknown option id → no category, seed still renders'
)
eq(
  choiceLabel(bundle, L1_TEXT_QID, L1_OPT_CUSTOMER),
  undefined,
  'pointing a category lookup at the open_text block yields nothing, not a wrong label'
)
eq(
  choiceLabel(bundle, 'PHASE-ONLY', L1_OPT_CUSTOMER),
  undefined,
  'a reflection qId (no step segment) is not addressable by choiceLabel'
)

// The single_choice answer stores the option UUID as `value`; buildSeeds pairs
// it with the open_text answer of the other step.
const l1Answers = {
  [L1_CATEGORY_QID]: { value: L1_OPT_CUSTOMER, submittedAt: 1 },
  [L1_TEXT_QID]: { value: 'tiap hari balas chat yang nanya harga sama ongkir', submittedAt: 2 },
}
eq(
  buildSeeds(bundle, l1Answers, l1Specs),
  [
    {
      source: 'L1_seed',
      text: 'tiap hari balas chat yang nanya harga sama ongkir',
      category: L1_OPT_CUSTOMER_LABEL,
    },
  ],
  'L1 seed end to end against the fixture'
)

// ---------------------------------------------------------------------------
// Degrade paths — "never block L4 if seeds empty". Every one of these has to
// produce a shorter list, never a card with an empty string or an exception.
// ---------------------------------------------------------------------------

eq(buildSeeds(bundle, {}, l1Specs), [], 'no answers at all → no seeds')
eq(
  buildSeeds(bundle, { [L1_TEXT_QID]: { value: '   ' } }, l1Specs),
  [],
  'answered but blank → no seed'
)
eq(
  buildSeeds(bundle, { [L1_TEXT_QID]: { value: 'text only' } }, l1Specs),
  [{ source: 'L1_seed', text: 'text only' }],
  'text without a category still yields a seed, with the category key ABSENT'
)
eq(
  buildSeeds(undefined, l1Answers, l1Specs),
  [{ source: 'L1_seed', text: 'tiap hari balas chat yang nanya harga sama ongkir' }],
  'bundle unavailable → seed without category, not a crash'
)

// Ordering is spec order, and a later phase's spec (reflection) mixes in.
const l2Phase = 'L2-REFLECTION-PHASE'
const bothSpecs: SeedSpec[] = [l1Specs[0], reflectionSeedSpec(l2Phase, 'L2_reflection')]
eq(
  buildSeeds(
    bundle,
    { ...l1Answers, [l2Phase]: { value: { text: 'produkku dari resep keluarga', scale: 5 } } },
    bothSpecs
  ),
  [
    {
      source: 'L1_seed',
      text: 'tiap hari balas chat yang nanya harga sama ongkir',
      category: L1_OPT_CUSTOMER_LABEL,
    },
    { source: 'L2_reflection', text: 'produkku dari resep keluarga' },
  ],
  'both seeds, in spec order'
)
eq(
  buildSeeds(bundle, { ...l1Answers, [l2Phase]: { value: { scale: 5 } } }, bothSpecs).length,
  1,
  'L2 answered with a scale but no text → only the L1 seed survives'
)

// ---------------------------------------------------------------------------
// seedQIds — the subscription set. Deduped, because two specs may share a
// category qId, and stable, because the hook keys its effect on the join.
// ---------------------------------------------------------------------------

eq(
  seedQIds([l1Specs[0], l1Specs[0]]),
  [L1_TEXT_QID, L1_CATEGORY_QID],
  'duplicate specs collapse to one subscription pair, text before category'
)
eq(seedQIds([reflectionSeedSpec(l2Phase, 'L2_reflection')]), [l2Phase], 'no category → one qId')
eq(seedQIds([]), [], 'no specs → no subscriptions')
ok(
  seedQIds([l1Specs[0]]).every((q) => !q.includes(',')),
  'qIds are comma-free (the join is safe)'
)

// ---------------------------------------------------------------------------
// mergeSeedAnswer — the fold the hook's setState performs. Three properties
// matter, and all three are invisible in a browser until they misbehave:
// an unwritten node must not blank an existing seed, the unwrap must match what
// buildSeeds expects, and a repeat snapshot must not churn the map identity
// (which would re-render every consumer on every Firebase echo).
// ---------------------------------------------------------------------------

eq(mergeSeedAnswer({}, 'q', { value: 'a', submittedAt: 1 }), { q: 'a' }, 'stored node unwrapped')
eq(mergeSeedAnswer({}, 'q', 'a'), { q: 'a' }, 'bare value accepted')
eq(
  mergeSeedAnswer({}, 'q', { text: 'r', scale: 4 }),
  { q: { text: 'r', scale: 4 } },
  'reflection node kept whole'
)

const seeded = mergeSeedAnswer({}, L1_TEXT_QID, 'my words')
eq(mergeSeedAnswer(seeded, L1_TEXT_QID, null), seeded, 'a null snapshot leaves the map untouched')
eq(
  mergeSeedAnswer(seeded, L1_TEXT_QID, undefined),
  seeded,
  'an undefined snapshot leaves the map untouched'
)

const sameValue = mergeSeedAnswer(seeded, L1_TEXT_QID, { value: 'my words' })
ok(sameValue === seeded, 'a repeat snapshot preserves the map identity (no needless re-render)')
ok(
  mergeSeedAnswer(seeded, 'other', 'x') !== seeded,
  'a genuinely new answer DOES produce a new map'
)

// The end-to-end fold: two listeners firing into one map feed buildSeeds, and
// the result must equal having had every answer up front.
const folded = seedQIds(l1Specs).reduce(
  (acc, qId) => mergeSeedAnswer(acc, qId, l1Answers[qId]),
  {} as Record<string, unknown>
)
eq(
  buildSeeds(bundle, folded, l1Specs),
  buildSeeds(bundle, l1Answers, l1Specs),
  'folding snapshots one at a time equals having all answers up front'
)

console.log('seeds.selfcheck: OK')
