import type { Question } from '@helden-inc/tg-schema'

// Whether a not-yet-committed draft is enough to satisfy gate.requireAnswered
// for this question. Scale always has a value (there's no "empty" slider
// position), so it never blocks — the other types need an explicit pick/typed
// answer.
export function isDraftValid(question: Question, draft: unknown): boolean {
  if (question.qType === 'single_choice') return typeof draft === 'string' && draft.length > 0
  if (question.qType === 'multi_choice') return Array.isArray(draft) && draft.length > 0
  if (question.qType === 'scale') return typeof draft === 'number'
  return typeof draft === 'string' && draft.trim().length > 0
}
