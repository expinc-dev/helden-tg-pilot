import type { MicroStep, MicrolearningContent, Question } from '@helden-inc/tg-schema'

// Pure helpers for the "one screen per step" player flow (sequential
// microlearning whose steps are only text / headings / buttons and simple
// questions). Free of Firebase/React so it stays unit-checkable under plain
// `npx tsx`.

const SIMPLE_Q_TYPES = new Set(['single_choice', 'multi_choice', 'open_text', 'short_answer'])
const SIMPLE_BLOCK_KINDS = new Set(['text', 'heading', 'image', 'button', 'question'])

// Every block is text/heading/image/button or a question of a simple qType (any
// number of each, including zero questions). Video, html, timers and
// path/order/scan/scale… questions keep the original block-by-block flow.
export function isSimpleStep(step: MicroStep): boolean {
  if (step.blocks.length === 0) return false
  return step.blocks.every((b) => {
    if (!SIMPLE_BLOCK_KINDS.has(b.kind)) return false
    return b.kind !== 'question' || SIMPLE_Q_TYPES.has(b.question.qType)
  })
}

export function isSequentialSimple(content: MicrolearningContent): boolean {
  return (
    content.mode === 'sequential' && content.steps.length > 0 && content.steps.every(isSimpleStep)
  )
}

// Index of the step's first question block (-1 when it has none).
export function questionBlockIndex(step: MicroStep): number {
  return step.blocks.findIndex((b) => b.kind === 'question')
}

// Markdown → comparable plain text (for "does this intro just repeat the
// question?" checks).
export function plainText(markdown: string): string {
  return markdown
    .replace(/[*_#`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function plainPrompt(question: Question): string {
  return plainText(question.prompt.map((b) => (b.kind === 'text' ? b.markdown : '')).join(' '))
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
