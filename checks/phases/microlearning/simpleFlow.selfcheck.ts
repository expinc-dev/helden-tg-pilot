// Runnable self-check for the one-screen-per-step eligibility rule. No runner:
//   npx tsx checks/phases/microlearning/simpleFlow.selfcheck.ts
import type { MicroStep } from '@helden-inc/tg-schema'

import { isSimpleStep, plainText } from '../../../src/phases/Microlearning/PlayerPane/simpleFlow'

function eq(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    console.error(`FAIL ${label}: got ${String(actual)}, want ${String(expected)}`)
    process.exit(1)
  }
}

const step = (blocks: unknown[]) => ({ id: 's', blocks }) as unknown as MicroStep
const q = (qType: string) => ({ kind: 'question', question: { qType, prompt: [] } })

eq(isSimpleStep(step([{ kind: 'text', markdown: 'a' }, { kind: 'button' }])), true, 'text + button')
eq(isSimpleStep(step([q('open_text'), q('open_text'), q('open_text')])), true, 'many questions')
eq(isSimpleStep(step([{ kind: 'text', markdown: 'a' }, q('single_choice')])), true, 'text + choice')
eq(isSimpleStep(step([{ kind: 'image' }, { kind: 'text', markdown: 'a' }])), true, 'image + text')
eq(isSimpleStep(step([{ kind: 'video' }, q('open_text')])), false, 'video block')
eq(isSimpleStep(step([q('path_question')])), false, 'path question')
eq(isSimpleStep(step([q('scale')])), false, 'scale question')
eq(isSimpleStep(step([])), false, 'empty step')
eq(plainText('**Contoh:** Halo  Dunia'), 'contoh: halo dunia', 'plainText')

console.log('simpleFlow.selfcheck: OK')
