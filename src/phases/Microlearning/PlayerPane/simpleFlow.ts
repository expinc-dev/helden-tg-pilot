import type { MicroStep, MicrolearningContent } from '@helden-inc/tg-schema'

// Pure helpers for the "one question per screen" player flow (sequential
// microlearning whose steps are just [text?] + one simple question). Free of
// Firebase/React so it stays unit-checkable under plain `npx tsx`.

const SIMPLE_Q_TYPES = new Set(['single_choice', 'multi_choice', 'open_text', 'short_answer'])

// ≤1 text block + exactly 1 question block of a simple qType. Anything else
// (images, buttons, path/order/scan questions…) keeps the original block flow.
export function isSimpleStep(step: MicroStep): boolean {
  const questions = step.blocks.filter((b) => b.kind === 'question')
  const texts = step.blocks.filter((b) => b.kind === 'text')
  if (questions.length !== 1 || texts.length > 1) return false
  if (questions.length + texts.length !== step.blocks.length) return false
  const q = questions[0]
  return q.kind === 'question' && SIMPLE_Q_TYPES.has(q.question.qType)
}

export function isSequentialSimple(content: MicrolearningContent): boolean {
  return (
    content.mode === 'sequential' && content.steps.length > 0 && content.steps.every(isSimpleStep)
  )
}

export function questionBlockIndex(step: MicroStep): number {
  return step.blocks.findIndex((b) => b.kind === 'question')
}

// "Contoh: …" line authored in the step's intro text, reused as the textarea
// placeholder. Undefined when the step has no such line.
export function exampleHint(step: MicroStep): string | undefined {
  for (const b of step.blocks) {
    if (b.kind !== 'text') continue
    const m = b.markdown.match(/Contoh:[^\n]*/i)
    if (m) return m[0].replace(/\*+/g, '').trim()
  }
  return undefined
}

// Option that opens a free-text field ("Lainnya", "Lainnya (tulis sendiri)").
export const isOtherLabel = (label: string) => /^lainnya/i.test(label.trim())
export const otherDisplayLabel = (label: string) => label.replace(/\s*\(.*\)\s*$/, '').trim()
