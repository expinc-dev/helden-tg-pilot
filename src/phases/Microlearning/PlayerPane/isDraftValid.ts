import type { Question } from '@helden-inc/tg-schema'

// Whether a not-yet-committed draft is enough to satisfy gate.requireAnswered
// for this question. Scale and order always have a value (no "empty" slider
// position, and OrderQuestionView seeds the draft with the authored item
// order on mount), so neither ever blocks — image_sequence requires every
// slot filled, the rest need an explicit pick/typed answer.
export function isDraftValid(question: Question, draft: unknown): boolean {
  if (question.qType === 'single_choice') return typeof draft === 'string' && draft.length > 0
  if (question.qType === 'multi_choice') return Array.isArray(draft) && draft.length > 0
  if (question.qType === 'scale') return typeof draft === 'number'
  if (question.qType === 'order') return Array.isArray(draft)
  if (question.qType === 'image_sequence') {
    return Array.isArray(draft) && draft.length > 0 && draft.every((v) => v !== null)
  }
  if (question.qType === 'qr_scan' || question.qType === 'pattern_scan') {
    // Unlike every other qType here, "answered" isn't just "has a value" —
    // microlearning is otherwise ungraded, but a scan genuinely has to match
    // (see ScanQuestion.tsx), not merely have been attempted.
    return (
      typeof draft === 'object' &&
      draft !== null &&
      (draft as { matched?: boolean }).matched === true
    )
  }
  return typeof draft === 'string' && draft.trim().length > 0
}
