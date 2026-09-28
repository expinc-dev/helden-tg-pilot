// Runnable self-check for the closing templates (HLN-014): the commitment
// the participant writes, and the recap that reads it back.
//
// Pure functions only — config parsing, sentence assembly, the two readers and
// the two scorers. No React, Firebase or bundle import (see the header of
// checks/lib/session/seeds.selfcheck.ts for why: src/lib/demoBundle*.ts is
// author-editable and must stay out of here).
//   npx tsx checks/phases/minigames/commitment.selfcheck.ts
import {
  COMMITMENT_EMPTY_SLOT,
  assembleCommitment,
  commitmentConfigSchema,
  commitmentDefaultConfig,
  missingCommitmentKeys,
  scoreCommitment,
} from '../../../src/phases/Minigames/Commitment/score'
import type { CommitmentConfig } from '../../../src/phases/Minigames/Commitment/score'
import {
  journeyConfigSchema,
  journeyDefaultConfig,
  readJourneyCommitment,
  readJourneyPrompt,
  scoreJourney,
  seedSpecsFrom,
} from '../../../src/phases/Minigames/Journey/score'
import type { JourneyConfig } from '../../../src/phases/Minigames/Journey/score'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: unknown, b: unknown, msg: string) => {
  const sa = JSON.stringify(a)
  const sb = JSON.stringify(b)
  if (sa !== sb) throw new Error(`FAIL: ${msg}\n  got:      ${sa}\n  expected: ${sb}`)
}

// Everything below drives the shipped default config unless it says otherwise,
// so the assertions pin the copy that actually ships, not a convenient literal.
const cfg = commitmentDefaultConfig
const jcfg = journeyDefaultConfig

const scoreArgs = <T>(config: T, answer: unknown) => ({
  config,
  answer,
  phaseStartMs: 0,
})

// ---------------------------------------------------------------------------
// assembleCommitment
// ---------------------------------------------------------------------------

eq(
  assembleCommitment(
    'Saya akan {{action}}, supaya {{reason}}',
    'tanya harga ke pelanggan',
    'tahu margin saya'
  ),
  'Saya akan tanya harga ke pelanggan, supaya tahu margin saya',
  'both halves are spliced into the shipped sentence pattern'
)

// The participant types spaces; the sentence must not carry them into the middle
// of a clause. `"Saya akan  tanya"` with a double space is the kind of thing that
// only shows up on the projector.
eq(
  assembleCommitment('Saya akan {{action}}, supaya {{reason}}', '  rapi  ', '  bersih  '),
  'Saya akan rapi, supaya bersih',
  'whitespace around a half is trimmed'
)

// `{{ action }}` is what an author types when they are being careful, and it
// must mean exactly the same thing — otherwise a template that looks right shows
// a literal placeholder to the participant at the last moment of the day.
eq(
  assembleCommitment('Akan {{ action }} karena {{ reason }}', 'x', 'y'),
  'Akan x karena y',
  'whitespace inside a placeholder is tolerated'
)

// An empty half must be VISIBLE. The submit button is gated on both halves, so
// this only renders mid-typing — but a sentence that silently reads "Saya akan ,
// supaya …" would let the participant confirm something that is not there.
eq(
  assembleCommitment('Saya akan {{action}}, supaya {{reason}}', 'tanya harga', '   '),
  `Saya akan tanya harga, supaya ${COMMITMENT_EMPTY_SLOT}`,
  'a blank half renders the empty-slot marker, not nothing'
)

// An unknown placeholder is left verbatim rather than blanked: the author named
// something this template does not collect, and `{{foo}}` on screen is a bug
// report whereas an empty string is a silently wrong commitment.
{
  const out = assembleCommitment('A {{action}} B {{tidak-ada}} C {{reason}}', 'x', 'y')
  ok(out.includes('{{tidak-ada}}'), 'an unknown placeholder survives verbatim')
  ok(out.startsWith('A x B'), 'a known placeholder next to it still resolves')
  ok(out.endsWith('C y'), 'a known placeholder after it still resolves')
}

// The same key twice is a normal authoring choice. A non-global regex would
// silently leave the second one behind.
eq(
  assembleCommitment('{{action}} … {{action}}', 'ulang', 'y'),
  'ulang … ulang',
  'a repeated placeholder is replaced every time'
)

// ---------------------------------------------------------------------------
// The shipped sentence pattern
// ---------------------------------------------------------------------------

// The storyboard's design note is the reason HLN-014 is a structured two-field
// entry rather than an open_text box: the FORMAT is the pedagogy. If the shipped
// default ever loses the pattern, the phase silently degrades into Option A and
// nothing else in this file would notice.
eq(
  assembleCommitment(cfg.sentenceTemplate, 'perbaiki tulisan promo', 'terdengar seperti saya'),
  'Saya akan perbaiki tulisan promo, supaya terdengar seperti saya',
  'the shipped default assembles the storyboard sentence'
)

ok(
  cfg.sentenceTemplate.includes('{{action}}') && cfg.sentenceTemplate.includes('{{reason}}'),
  'the shipped sentence pattern names both halves'
)

// The instruction block is the only place the required shape is explained, so a
// default that dropped it would leave two unlabelled boxes.
ok(cfg.instructions.includes('Saya akan'), 'the shipped instructions restate the sentence shape')
ok(cfg.instructions.trim().length > 0, 'the shipped instructions are not empty')

// ---------------------------------------------------------------------------
// missingCommitmentKeys / scoreCommitment
// ---------------------------------------------------------------------------

eq(missingCommitmentKeys('a', 'b'), [], 'a filled commitment is missing nothing')
eq(missingCommitmentKeys('', 'b'), ['action'], 'a blank action is named')
eq(missingCommitmentKeys('a', ''), ['reason'], 'a blank reason is named')
eq(missingCommitmentKeys('  ', '  '), ['action', 'reason'], 'whitespace-only counts as blank')
eq(missingCommitmentKeys(' a ', ' b '), [], 'padding does not make a filled half blank')

// answered only when BOTH halves are filled — the whole point of the two-field
// shape. A partially filled commitment must not register as done on the wall.
{
  const s = scoreCommitment(
    scoreArgs<CommitmentConfig>(cfg, { action: 'a', reason: 'b', sentence: 'A a, supaya b' })
  )
  eq(s.answered, true, 'a complete commitment is answered')
  eq(s.correct, false, 'a commitment never scores points')
  eq(s.elapsedMs, 0, 'a commitment has no meaningful elapsed time')
}

{
  const s = scoreCommitment(
    scoreArgs<CommitmentConfig>(cfg, { action: 'a', reason: '', sentence: 'x' })
  )
  eq(s.answered, false, 'a half-filled commitment is not answered')
}

// The scorer reads a persisted node, so it must tolerate anything a reader can
// hand it: a missing answer, a bare string, an object shape from an older write.
// Throwing here would take down the flush for the whole room.
for (const bad of [undefined, null, '', 'nope', 42, [], {}]) {
  const s = scoreCommitment(scoreArgs<CommitmentConfig>(cfg, bad))
  eq(s.answered, false, `a ${JSON.stringify(bad)} answer is not answered`)
  eq(s.correct, false, `a ${JSON.stringify(bad)} answer never scores`)
}

// The raw `{ value, submittedAt }` wrapper is what a snapshot actually holds, and
// the scorer is documented as reading the persisted shape.
eq(
  scoreCommitment(
    scoreArgs<CommitmentConfig>(cfg, {
      value: { action: 'a', reason: 'b', sentence: 'x' },
      submittedAt: 1,
    })
  ).answered,
  false,
  'the scorer reads the answer object, not the snapshot wrapper'
)

// ---------------------------------------------------------------------------
// readJourneyPrompt / readJourneyCommitment
// ---------------------------------------------------------------------------

eq(
  readJourneyPrompt({ pathLabel: 'Perkuat Suaramu', prompt: 'Kamu adalah asisten…' }),
  { pathLabel: 'Perkuat Suaramu', prompt: 'Kamu adalah asisten…' },
  'an L4b answer reads through the unwrapped shape'
)

// The wrapper is what a caller holding a snapshot passes; both must work, which
// is the entire reason `answerValue` exists.
eq(
  readJourneyPrompt({ value: { pathLabel: 'P', prompt: 'X' }, submittedAt: 1 }),
  { pathLabel: 'P', prompt: 'X' },
  'the { value, submittedAt } wrapper is unwrapped exactly once'
)

// A prompt that is present but blank is treated as missing: an empty `pre` block
// reads as a rendering bug, which is worse than an absent section.
eq(readJourneyPrompt({ pathLabel: 'P', prompt: '   ' }), undefined, 'a blank prompt is missing')
eq(readJourneyPrompt({ pathLabel: 'P' }), undefined, 'a prompt-less answer is missing')
eq(readJourneyPrompt(undefined), undefined, 'a missing answer yields undefined')
eq(readJourneyPrompt('nope'), undefined, 'a non-object answer yields undefined')

// A path label that is missing is not fatal — the prompt is the content, the
// label is decoration, so the prompt still renders.
eq(
  readJourneyPrompt({ prompt: 'X' }),
  { pathLabel: '', prompt: 'X' },
  'a missing path label degrades to empty, keeping the prompt'
)

// The stored sentence wins over the halves: it is what the participant watched
// themselves assemble, and re-joining after an author edits the template would
// rewrite a commitment already made.
eq(
  readJourneyCommitment({
    action: 'a',
    reason: 'b',
    sentence: 'Saya akan a, supaya b',
  }),
  { text: 'Saya akan a, supaya b' },
  'the stored sentence is preferred'
)

// An answer written before `sentence` existed still renders, joined the way the
// default template would have joined it. Losing the recap section for every
// early participant is not an acceptable way to handle a schema addition.
eq(
  readJourneyCommitment({ action: 'a', reason: 'b' }),
  { text: 'Saya akan a, supaya b' },
  'a sentence-less answer falls back to joining the halves'
)

{
  const v = readJourneyCommitment({ value: { sentence: ' S ' }, submittedAt: 1 })
  eq(v, { text: 'S' }, 'the wrapper is unwrapped and the sentence trimmed')
}

// Nothing written → no section. This is the normal path for a participant who
// joined late or skipped the closing, not an error.
for (const bad of [undefined, null, { action: '', reason: '' }, 'x', 7]) {
  eq(readJourneyCommitment(bad), undefined, `a ${JSON.stringify(bad)} answer yields no section`)
}

// ---------------------------------------------------------------------------
// scoreJourney
// ---------------------------------------------------------------------------

{
  const s = scoreJourney(scoreArgs<JourneyConfig>(jcfg, { anything: true }))
  eq(s.answered, false, 'the recap never reports a submission')
  eq(s.correct, false, 'the recap never scores')
}

// ---------------------------------------------------------------------------
// Config contracts
// ---------------------------------------------------------------------------

// A blank config must still produce a usable screen: every key has a default, so
// a phase published before the author fills anything renders instead of throwing
// on an undefined field.
{
  const parsed = commitmentConfigSchema.safeParse({})
  eq(parsed.success, true, 'an empty commitment config parses (all keys default)')
  const parsedJourney = journeyConfigSchema.safeParse({})
  eq(parsedJourney.success, true, 'an empty journey config parses (all keys default)')
}

// The two BLANK phase ids are a deliberate authoring state, not a placeholder to
// be "fixed" by guessing: a guessed id would read a node nobody writes and drop
// that section with no visible cause.
eq(
  journeyDefaultConfig.formToPromptPhaseId,
  '',
  'the recap ships without an L4b phase id (the author sets it)'
)
eq(
  journeyDefaultConfig.commitmentPhaseId,
  '',
  'the recap ships without a commitment phase id (the author sets it)'
)

// The recap's own seed list is the SAME binding the L4 form ships, resolved by
// the SAME builder — so a config copied between the phases cannot drift into
// reading a qId under a different convention.
eq(
  seedSpecsFrom(journeyDefaultConfig.seedBindings),
  seedSpecsFrom([
    {
      source: 'L1_seed',
      cardLabel: '',
      phaseId: '01a0c7b0-666f-77b1-9592-b394036528d1',
      stepId: '01a0c93e-4dd3-72b1-8d10-89aa24461e33',
      blockIndex: 1,
      categoryStepId: '01a0c93c-3b96-7446-998b-29f6310d7928',
      categoryBlockIndex: 1,
    },
  ]),
  'the shipped recap binding resolves to the L1 seed spec'
)

{
  const specs = seedSpecsFrom(journeyDefaultConfig.seedBindings)
  eq(specs.length, 1, 'the shipped recap reads exactly one seed')
  eq(
    specs[0].qId,
    '01a0c7b0-666f-77b1-9592-b394036528d1_01a0c93e-4dd3-72b1-8d10-89aa24461e33_1',
    'the recap seed qId follows microlearning’s qId convention'
  )
  eq(specs[0].source, 'L1_seed', 'the recap seed comes from L1')
  ok(Boolean(specs[0].categoryQId), 'the recap seed carries its category qId')
}

// The author-supplied headings are what the recap renders above each section; an
// empty list of seeds with a heading set would leave a dangling label, which is
// why the player gates the whole <Section> on content. Pin that the defaults do
// name the three sections, so the shipped recap is not three unlabelled blocks.
for (const key of ['seedsHeading', 'promptHeading', 'commitmentHeading'] as const) {
  ok(jcfg[key].trim().length > 0, `the shipped recap names its "${key}" section`)
}
ok(jcfg.closingLine.trim().length > 0, 'the shipped recap has a closing line')

// Unknown seedSource: 'L3_whatever' is an authoring typo no later authoring can
// fix, and it is not a SOURCE the runtime understands. Rejected at build, so the
// phase fails loudly while the author is still in the CMS.
eq(
  journeyConfigSchema.safeParse({
    seedBindings: [{ source: 'L3_typo', phaseId: 'p' }],
  }).success,
  false,
  'an unknown seedSource is rejected in the recap config too'
)

console.log('commitment selfcheck: all assertions passed')
