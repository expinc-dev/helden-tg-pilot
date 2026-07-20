// Runnable self-check for the microlearning gating rule:
//   npx tsx checks/lib/sync/microStepGate.selfcheck.ts
import { stepRequiresAnswer } from '../../../src/lib/sync/microStepGate'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

// No gate at all -> never gated, regardless of block content.
ok(
  !stepRequiresAnswer({
    id: 's1',
    blocks: [{ kind: 'question', question: { qType: 'single_choice', prompt: [], options: [] } }],
  }),
  'no gate -> not required'
)

// gate.requireAnswered false -> not gated.
ok(
  !stepRequiresAnswer({
    id: 's1',
    gate: { requireAnswered: false },
    blocks: [{ kind: 'question', question: { qType: 'single_choice', prompt: [], options: [] } }],
  }),
  'requireAnswered:false -> not required'
)

// requireAnswered true but no question block -> not gated (author error, don't deadlock).
ok(
  !stepRequiresAnswer({
    id: 's1',
    gate: { requireAnswered: true },
    blocks: [{ kind: 'text', markdown: 'hi' }],
  }),
  'requireAnswered with no question -> not required'
)

// requireAnswered true + a question block present -> gated.
ok(
  stepRequiresAnswer({
    id: 's1',
    gate: { requireAnswered: true },
    blocks: [
      { kind: 'text', markdown: 'hi' },
      { kind: 'question', question: { qType: 'single_choice', prompt: [], options: [] } },
    ],
  }),
  'requireAnswered with question -> required'
)

console.log('microStepGate.selfcheck: OK')
