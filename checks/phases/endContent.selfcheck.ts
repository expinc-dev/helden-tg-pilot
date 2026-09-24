// Runnable self-check for the end phase's content resolution and image guard.
// Pure functions — no Firebase/React:
//   npx tsx checks/phases/endContent.selfcheck.ts
// Excluded from the app build (tsconfig.app.json includes only "src").
//
// The contract under test is the one endContentSchema + the CMS's EndEditor
// both document: perDevice !== true → every role sees the shared fields;
// perDevice === true → that role's block, falling back FIELD BY FIELD to the
// shared value when the block omits it (surfaced in the CMS as
// end.perDeviceHint / end.inheritedBadge). A regression here shows an author's
// shared title to one role and a blank to another, or a broken <img>.
import { type EndContent, resolveEndContent } from '../../src/phases/End/lib'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: unknown, b: unknown, msg: string) =>
  ok(
    JSON.stringify(a) === JSON.stringify(b),
    `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`
  )

// The shared (non-perDevice) shape — exactly the end phase the pilot's
// demoBundle ships: { type: 'end', title: 'Selesai', text: 'Thank You!!' }.
const shared: EndContent = { type: 'end', title: 'Selesai', text: 'Thank You!!' }

// ── perDevice off/absent: shared fields reach every role ────────────────────
{
  for (const role of ['host', 'central', 'player'] as const) {
    eq(
      resolveEndContent(shared, role, 'phase title'),
      {
        title: 'Selesai',
        text: 'Thank You!!',
        imageUrl: undefined,
      },
      `${role} sees the shared content`
    )
  }

  // Even with role blocks authored, perDevice: true absent keeps them inert.
  const withBlocks: EndContent = {
    ...shared,
    player: { title: 'Khusus pemain' },
    central: { title: 'Khusus central' },
    host: { title: 'Khusus host' },
  }
  eq(
    resolveEndContent(withBlocks, 'player', 't').title,
    'Selesai',
    'absent perDevice ignores role blocks'
  )
  eq(
    resolveEndContent({ ...withBlocks, perDevice: false }, 'central', 't').title,
    'Selesai',
    'perDevice:false ignores role blocks'
  )
}

// ── perDevice on: role block wins, field by field ───────────────────────────
{
  const doc: EndContent = {
    type: 'end',
    perDevice: true,
    title: 'Selesai',
    text: 'Thank You!!',
    player: { title: 'Terima kasih sudah bermain' },
    central: { text: 'Sampai jumpa di sesi berikutnya' },
    // host block deliberately absent entirely
  }

  eq(
    resolveEndContent(doc, 'player', 't'),
    {
      title: 'Terima kasih sudah bermain',
      text: 'Thank You!!',
      imageUrl: undefined,
    },
    'player overrides title only, inherits shared text'
  )

  eq(
    resolveEndContent(doc, 'central', 't'),
    {
      title: 'Selesai',
      text: 'Sampai jumpa di sesi berikutnya',
      imageUrl: undefined,
    },
    'central overrides text only, inherits shared title'
  )

  eq(
    resolveEndContent(doc, 'host', 't'),
    {
      title: 'Selesai',
      text: 'Thank You!!',
      imageUrl: undefined,
    },
    'role with no block falls back to shared, no throw'
  )

  // An empty role block must inherit everything, not blank the screen.
  eq(
    resolveEndContent({ ...doc, player: {} }, 'player', 't'),
    {
      title: 'Selesai',
      text: 'Thank You!!',
      imageUrl: undefined,
    },
    'empty role block inherits the shared fields'
  )
}

// ── title falls back to the phase title, last resort ────────────────────────
{
  eq(
    resolveEndContent({ type: 'end' }, 'host', 'Selesai').title,
    'Selesai',
    'no authored title → phase title'
  )
  eq(
    resolveEndContent({ type: 'end' }, 'host', 'Selesai').text,
    undefined,
    'no authored text → undefined, not empty string'
  )
  // An authored empty string is a real value and must not be replaced.
  eq(
    resolveEndContent({ type: 'end', title: '' }, 'host', 'Selesai').title,
    '',
    'authored empty title is respected'
  )
}

// ── imageMediaId: only a fetchable URL becomes an <img src> ─────────────────
{
  const M = (imageMediaId: string): EndContent => ({ type: 'end', imageMediaId })

  eq(
    resolveEndContent(M('https://cdn.example.com/final.png'), 'host', 't').imageUrl,
    'https://cdn.example.com/final.png',
    'https URL renders'
  )
  eq(
    resolveEndContent(M('http://cdn.example.com/final.png'), 'host', 't').imageUrl,
    'http://cdn.example.com/final.png',
    'http URL renders'
  )
  eq(
    resolveEndContent(M('/media/final.png'), 'host', 't').imageUrl,
    '/media/final.png',
    'root-relative path renders'
  )

  // What the CMS's MediaPickerDialog actually stores: a media-library UUID.
  // Rendering it would mean a broken-image icon on every authored end phase.
  eq(
    resolveEndContent(M('8f14e45f-ceea-467a-9a8b-2f7b0c4d1e66'), 'host', 't').imageUrl,
    undefined,
    'bare media id is not an image URL'
  )
  eq(resolveEndContent(M(''), 'host', 't').imageUrl, undefined, 'empty id is not an image URL')
  eq(resolveEndContent({ type: 'end' }, 'host', 't').imageUrl, undefined, 'no id → no image')

  // Per-role image inherits the same way the text fields do.
  eq(
    resolveEndContent(
      { type: 'end', perDevice: true, imageMediaId: 'https://a/b.png', player: {} },
      'player',
      't'
    ).imageUrl,
    'https://a/b.png',
    'perDevice role inherits shared image'
  )
  eq(
    resolveEndContent(
      {
        type: 'end',
        perDevice: true,
        imageMediaId: 'https://a/b.png',
        player: { imageMediaId: '/c.png' },
      },
      'player',
      't'
    ).imageUrl,
    '/c.png',
    'role image overrides shared image'
  )
}

console.log('endContent.selfcheck: OK')
