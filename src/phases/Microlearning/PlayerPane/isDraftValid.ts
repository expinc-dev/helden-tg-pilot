import type { MicroQuestion } from './OrderQuestion'

// Whether a not-yet-committed draft is enough to satisfy gate.requireAnswered
// for this question. Scale and order always have a value (no "empty" slider
// position, and OrderQuestionView seeds the draft with the authored item
// order on mount), so neither ever blocks — image_sequence requires every
// slot filled, the rest need an explicit pick/typed answer.
export function isDraftValid(question: MicroQuestion, draft: unknown): boolean {
  if (question.qType === 'single_choice') return typeof draft === 'string' && draft.length > 0
  if (question.qType === 'multi_choice') return Array.isArray(draft) && draft.length > 0
  if (question.qType === 'scale') return typeof draft === 'number'
  if (question.qType === 'order') return Array.isArray(draft)
  if (question.qType === 'image_sequence') {
    return Array.isArray(draft) && draft.length > 0 && draft.every((v) => v !== null)
  }
  return typeof draft === 'string' && draft.trim().length > 0
}
