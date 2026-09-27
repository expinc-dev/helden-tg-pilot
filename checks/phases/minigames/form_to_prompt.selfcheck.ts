// Runnable self-check for the form-to-prompt builder (HLN-005). Pure functions
// only — config parsing, prompt assembly and the seed binding — no React,
// Firebase or bundle import (see the header of checks/lib/session/seeds.selfcheck.ts
// for why: src/lib/demoBundle*.ts is author-editable and must stay out of here).
//   npx tsx checks/phases/minigames/form_to_prompt.selfcheck.ts
import {
  EMPTY_VALUE_MARKER,
  assemblePrompt,
  formToPromptConfigSchema,
  formToPromptDefaultConfig,
  missingRequiredKeys,
  scoreFormToPrompt,
  seedForSource,
  seedSpecsFrom,
} from '../../../src/phases/Minigames/FormToPrompt/score'
import type {
  FormToPromptConfig,
  FormToPromptPath,
} from '../../../src/phases/Minigames/FormToPrompt/score'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: unknown, b: unknown, msg: string) => {
  const sa = JSON.stringify(a)
  const sb = JSON.stringify(b)
  if (sa !== sb) throw new Error(`FAIL: ${msg}\n  got:      ${sa}\n  expected: ${sb}`)
}

// ---------------------------------------------------------------------------
// assemblePrompt
// ---------------------------------------------------------------------------

eq(
  assemblePrompt('Nama: {{nama}}, produk: {{produk}}', {
    nama: 'Warung Berkah',
    produk: 'nasi kotak',
  }),
  'Nama: Warung Berkah, produk: nasi kotak',
  'known placeholders are replaced'
)

// `{{ nama }}` is what an author types when they are being careful; it must mean
// exactly the same thing, or a template that looks right assembles with a visible
// placeholder left in it.
eq(
  assemblePrompt('Halo {{ nama }}!', { nama: 'Bu Sari' }),
  'Halo Bu Sari!',
  'whitespace inside a placeholder is tolerated'
)

// The same key twice is normal (a name appears in the role line AND the context
// line). A non-global regex would silently leave the second one behind.
eq(
  assemblePrompt('{{nama}} — usaha {{nama}}', { nama: 'Warung Berkah' }),
  'Warung Berkah — usaha Warung Berkah',
  'a repeated placeholder is replaced every time'
)

// Unknown placeholder: left verbatim, not blanked. Blanking it would produce a
// prompt that reads as finished and is missing whatever the author named.
{
  const out = assemblePrompt('X {{tidak-ada}} Y', { nama: 'Warung Berkah' })
  eq(out, 'X {{tidak-ada}} Y', 'an unknown placeholder is left visible')
  eq(out.includes(EMPTY_VALUE_MARKER), false, 'an unknown placeholder is not marked as empty')
}

// Known key, no value → explicit marker, so the participant can see WHICH line
// needs attention rather than reading a prompt with a hole in it.
eq(
  assemblePrompt('Nama: {{nama}}', { nama: '' }),
  `Nama: ${EMPTY_VALUE_MARKER}`,
  'a blank known value becomes the empty marker'
)
eq(
  assemblePrompt('Nama: {{nama}}', { nama: '   ' }),
  `Nama: ${EMPTY_VALUE_MARKER}`,
  'a whitespace-only value counts as blank'
)
// A key that is not in the map at all is indistinguishable from an unknown
// placeholder — that is the whole definition, and it is safe because the caller
// builds `values` from the path's OWN fields (player.tsx openPath), so every key
// the template should know about is present even when blank. Documented here
// because the opposite rule ("absent means blank") would silently hide a typo in
// a template instead of leaving the placeholder visible for whoever tests it.
eq(
  assemblePrompt('Nama: {{nama}}', {}),
  'Nama: {{nama}}',
  'an absent key is treated as an unknown placeholder'
)
eq(assemblePrompt('Nama: {{nama}}', { nama: '  Warung  ' }), 'Nama: Warung', 'values are trimmed')
// A template with no placeholders at all is still a valid prompt (the "Tanya
// Bebas" shape before the author adds fields) — replaceAll must not mangle it.
eq(assemblePrompt('Tanpa placeholder.', { nama: 'x' }), 'Tanpa placeholder.', 'plain template')
// Braces that are not a placeholder must survive: authors write JSON-ish prompt
// instructions, and a greedy pattern would eat them.
eq(assemblePrompt('Balas {"ok": true}', {}), 'Balas {"ok": true}', 'single braces are untouched')

// ---------------------------------------------------------------------------
// Config schema
// ---------------------------------------------------------------------------

{
  const parsed = formToPromptConfigSchema.safeParse(formToPromptDefaultConfig)
  ok(parsed.success, `the shipped default config parses (${parsed.success ? '' : parsed.error}`)
  if (parsed.success) {
    eq(parsed.data.paths.length, 4, 'the shipped default has four paths')
    for (const path of parsed.data.paths) {
      ok(path.fields.length > 0, `path ${path.id} has fields`)
      // Every `{{key}}` in the shipped templates must be a key the path's own
      // form actually collects. This is the one authoring mistake that produces
      // a visible placeholder on a participant's screen, and it is checkable
      // without a browser, so it is checked.
      const keys = new Set(path.fields.map((f) => f.key))
      for (const m of path.promptTemplate.matchAll(/\{\{\s*([^{}]*?)\s*\}\}/g)) {
        ok(keys.has(m[1]), `path ${path.id}: template placeholder ${m[0]} has a field`)
      }
    }
  }
}

// Legacy / hand-written config missing the optional-everything fields (a CMS
// draft is a raw Firestore object that is never parsed there, so a path authored
// before a field existed arrives without it).
{
  const parsed = formToPromptConfigSchema.safeParse({
    paths: [{ id: 'p', label: 'P', fields: [{ key: 'a', label: 'A' }], promptTemplate: '{{a}}' }],
  })
  ok(parsed.success, 'a minimal config parses')
  if (parsed.success) {
    eq(parsed.data.seeds, [], 'absent seeds default to an empty list')
    eq(parsed.data.bridge, '', 'absent bridge defaults to empty')
    eq(parsed.data.instructions, '', 'absent instructions default to empty')
    eq(parsed.data.paths[0].fields[0].required, true, 'absent required defaults to true')
    eq(parsed.data.paths[0].fields[0].placeholderExample, '', 'absent example defaults to empty')
    eq(parsed.data.paths[0].description, '', 'absent description defaults to empty')
  }
}

ok(
  !formToPromptConfigSchema.safeParse({ paths: [] }).success,
  'a config with zero paths is rejected (the chooser would be empty)'
)
ok(
  !formToPromptConfigSchema.safeParse({
    paths: [{ id: 'p', label: 'P', fields: [], promptTemplate: 'x' }],
  }).success,
  'a path with zero fields is rejected'
)

// ---------------------------------------------------------------------------
// missingRequiredKeys
// ---------------------------------------------------------------------------

const PATH: FormToPromptPath = formToPromptConfigSchema.parse({
  paths: [
    {
      id: 'p',
      label: 'P',
      fields: [
        { key: 'nama', label: 'Nama usaha', required: true },
        { key: 'lama', label: 'Tulisan lama', required: false },
        { key: 'beda', label: 'Beda', required: true },
      ],
      promptTemplate: '{{nama}} {{lama}} {{beda}}',
    },
  ],
}).paths[0]

eq(
  missingRequiredKeys(PATH, { nama: '', lama: '', beda: '' }),
  ['nama', 'beda'],
  'both required listed'
)
eq(
  missingRequiredKeys(PATH, { nama: 'Warung', lama: '', beda: 'Resep keluarga' }),
  [],
  'all required filled'
)
eq(
  missingRequiredKeys(PATH, { nama: 'Warung', lama: '', beda: '  ' }),
  ['beda'],
  'whitespace does not count as filled'
)
// An optional field must NEVER appear here — "required: false" is how the author
// says "this one may be blank" (path A's "tulisan promo lama").
eq(
  missingRequiredKeys(PATH, { nama: 'Warung', lama: '', beda: 'Resep' }).includes('lama'),
  false,
  'an optional field is never reported missing'
)

// ---------------------------------------------------------------------------
// scoreFormToPrompt
// ---------------------------------------------------------------------------

const CONFIG: FormToPromptConfig = formToPromptConfigSchema.parse({
  paths: [PATH],
})
const score = (answer: unknown) => scoreFormToPrompt({ config: CONFIG, answer, phaseStartMs: 0 })

eq(
  score({ pathId: 'p', fields: { nama: 'W', beda: 'R' } }),
  {
    correct: false,
    answered: true,
    elapsedMs: 0,
  },
  'a fully-filled answer reads as answered, never correct'
)
eq(
  score({ pathId: 'p', fields: { nama: 'W', beda: '' } }).answered,
  false,
  'a gap reads as unanswered'
)
// Reflection-shaped activities award nothing: `correct` is false even when the
// form is complete, so a phase with points configured still scores zero here.
eq(score({ pathId: 'p', fields: { nama: 'W', beda: 'R' } }).correct, false, 'never correct')
// Tolerating a bad/older node rather than throwing: the scorer runs at flush time
// for every player, and one malformed answer must not break the whole flush.
eq(score(undefined).answered, false, 'undefined answer does not throw')
eq(score('nope').answered, false, 'a non-object answer does not throw')
eq(score({ fields: {} }).answered, false, 'a missing pathId does not throw')
eq(score({ pathId: 'gone', fields: { nama: 'W', beda: 'R' } }).answered, false, 'an unknown pathId')
eq(
  score({ pathId: 'p', fields: { nama: 42, beda: null } }).answered,
  false,
  'non-string field values count as empty'
)

// ---------------------------------------------------------------------------
// seedSpecsFrom / seedForSource
// ---------------------------------------------------------------------------

{
  // A microlearning binding needs BOTH stepId and blockIndex (the ids are
  // authored; getting this wrong yields "no seed" with no error at runtime).
  const specs = seedSpecsFrom([
    {
      source: 'L1_seed',
      cardLabel: 'Yang kamu tulis di awal tadi',
      phaseId: 'P1',
      stepId: 'S2',
      blockIndex: 1,
      categoryStepId: 'S1',
      categoryBlockIndex: 1,
    },
    { source: 'L2_reflection', cardLabel: 'Setelah Suara Bu Sari', phaseId: 'P2' },
  ])
  eq(
    specs[0],
    { source: 'L1_seed', qId: 'P1_S2_1', categoryQId: 'P1_S1_1' },
    'micro binding → micro qId'
  )
  eq(specs[1], { source: 'L2_reflection', qId: 'P2' }, 'reflection binding → bare phaseId')

  // A micro binding WITHOUT a blockIndex is a reflection binding, not a broken
  // micro one: an author who leaves the coordinate off must get an empty seed,
  // never a qId like "P1_S2_undefined" that silently reads nothing.
  const partial = seedSpecsFrom([{ source: 'L1_seed', cardLabel: '', phaseId: 'P1', stepId: 'S2' }])
  eq(partial[0].qId, 'P1', 'a half-specified micro binding degrades to the bare phaseId')
}

{
  const seeds = [
    { source: 'L1_seed' as const, text: 'balas chat harga', category: 'Melayani pelanggan' },
    { source: 'L2_reflection' as const, text: 'resep keluarga' },
  ]
  eq(seedForSource(seeds, 'L1_seed')?.text, 'balas chat harga', 'lookup by source')
  eq(seedForSource(seeds, 'L2_reflection')?.category, undefined, 'a seed without a category')
  eq(seedForSource(seeds, undefined), undefined, 'a field with no seedSource resolves to nothing')
  eq(seedForSource([], 'L1_seed'), undefined, 'no seeds at all')
}

// The shipped default binds exactly the L1 seed the demo session actually has.
// The L2 binding is deliberately absent: L2 has no phase instance yet, so a
// `phaseId` for it would be a value nobody can verify (see score.ts's default
// config comment). The consequence is documented and intentional — a field whose
// `seedSource` resolves to nothing falls back to `placeholderExample` and its
// "sudah terisi dari jawabanmu" hint disappears, which is the same quiet
// degradation as a participant who has not answered yet.
{
  const defaultSources = formToPromptDefaultConfig.seeds.map((b) => b.source)
  eq(defaultSources, ['L1_seed'], 'the shipped default binds only the L1 seed')
  const l1 = formToPromptDefaultConfig.seeds[0]
  ok(Boolean(l1.phaseId), 'the L1 binding names a phase')

  // Every `seedSource` a default field names must still be a SOURCE the schema
  // knows about — an unbound L2 is a missing binding (author's job), but
  // 'L3_whatever' would be an authoring typo that no amount of later authoring
  // can fix. `formToPromptFieldSchema` already rejects it, so this pins the
  // rejection at the config level too.
  const named = new Set(
    formToPromptDefaultConfig.paths.flatMap((p) =>
      p.fields.map((f) => f.seedSource).filter((s): s is 'L1_seed' | 'L2_reflection' => Boolean(s))
    )
  )
  ok(named.has('L1_seed'), 'a default field reads the L1 seed')
  eq(
    formToPromptConfigSchema.safeParse({
      paths: [
        {
          id: 'p',
          label: 'P',
          fields: [{ key: 'a', label: 'A', seedSource: 'L3_typo' }],
          promptTemplate: '{{a}}',
        },
      ],
    }).success,
    false,
    'an unknown seedSource is rejected'
  )
}

console.log('form_to_prompt selfcheck: all assertions passed')
