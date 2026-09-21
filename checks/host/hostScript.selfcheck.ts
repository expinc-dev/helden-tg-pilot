// Runnable self-check for the host-only phase script (HLN-001). No test runner:
//   npx tsx --tsconfig tsconfig.app.json checks/host/hostScript.selfcheck.ts
//
// The --tsconfig flag matters: tsx resolves the ROOT tsconfig.json from cwd,
// and that config has "files": [] with no "jsx", so without this flag the
// imported .tsx component compiles with the classic transform and dies on
// "React is not defined". Every other check imports only .ts modules and so
// runs fine without it.
// Covers both halves of the host-script contract that a static read cannot:
// the authored bundle still parses against the real schema, and the panel the
// host actually gets shows the script — including the unauthored fallback,
// which must be visible without expanding anything.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { type Phase, publishedGameSchema } from '@helden-inc/tg-schema'

import { demoBundle } from '../../src/lib/demoBundle'
import { HostScriptPanel } from '../../src/pages/host/_shared/HostScriptPanel'

let failures = 0
const check = (name: string, cond: boolean) => {
  if (cond) {
    console.log(`ok   ${name}`)
  } else {
    failures += 1
    console.error(`FAIL ${name}`)
  }
}

// --- the authored bundle is schema-valid and actually carries a host script ---
const parsed = publishedGameSchema.safeParse(demoBundle)
if (!parsed.success) {
  console.error('FAIL demoBundle parses against publishedGameSchema')
  console.error(JSON.stringify(parsed.error.issues, null, 2))
  process.exit(1)
}
console.log('ok   demoBundle parses against publishedGameSchema')

const phases = Object.values(parsed.data.phases)
const authoredPhases = phases.filter((p) => p.hostScript)
check('a phase carries hostScript', authoredPhases.length > 0)

// --- what the host sees ---
// createElement rather than JSX: correct under either transform, and this file
// is run through tsx, not the app's vite pipeline.
const render = (phase: Phase | null) =>
  renderToStaticMarkup(createElement(HostScriptPanel, { phase }))

const authored = phases.find((p) => p.hostScript) as Phase
const html = render(authored)

check(
  'anchor script is rendered',
  html.includes('Ingatkan peserta bahwa tidak ada jawaban yang salah')
)
check('sharing prompts section is rendered', html.includes('Prompt Berbagi'))
check('sharing prompt text is rendered', html.includes('Jalur mana yang kamu pilih dan kenapa?'))
check('improv marker is shown', html.includes('Host Improvisation'))
check('no fallback text when authored', !html.includes('No script authored for this phase'))

// The empty state a phase the trainer never authored produces. Visible without
// expanding the panel — a fallback behind a collapsed toggle is one the host
// never reads.
const bare: Phase = { ...authored, id: 'bare', hostScript: undefined }
const htmlBare = render(bare)
check('fallback shown when unauthored', htmlBare.includes('No script authored for this phase'))
check('no improv marker when unauthored', !htmlBare.includes('Host Improvisation'))

// Marker without a script: the cue is what the host must not lose.
const markerOnly: Phase = { ...authored, id: 'marker', hostScript: { improvMarker: true } }
const htmlMarkerOnly = render(markerOnly)
check('improv marker survives a missing script', htmlMarkerOnly.includes('Host Improvisation'))
check(
  'fallback shown with marker only',
  htmlMarkerOnly.includes('No script authored for this phase')
)

check('renders nothing without a phase', render(null) === '')

if (failures > 0) {
  console.error(`hostScript.selfcheck: ${failures} FAILED`)
  process.exit(1)
}
console.log('hostScript.selfcheck: OK')
