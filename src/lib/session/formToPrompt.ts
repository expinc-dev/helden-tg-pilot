import type { FormToPromptAnswerValue } from '@/phases/Minigames/FormToPrompt/score'

import { submitAnswer } from '@/lib/sync/submitAnswer'

// The one writer for a form-to-prompt answer:
// `sessions/{id}/players/{writerId}/answers/{phaseId}`.
//
// Component-local state (the field values, which path is open) deliberately does
// NOT live here — only the persisted shape does — so the answer node has exactly
// one definition and the scorer (score.ts) and the Closing recap (HLN-014) read
// the same thing the player wrote.
//
// Goes through `submitAnswer` rather than a bare `set`, for the neutral 4b
// progress counter the central screen renders (storyboard §4b: "progress 'berapa
// peserta sudah submit' … TIDAK tampilkan isi kerja siapa pun"). That counter
// reads `aggregates/answeredCount/{phaseId}`, and `submitAnswer` is the only
// writer that bumps it. Two other minigames write their answer node directly and
// their central screens therefore have no count to show; this one is specified
// to have one.
//
// `keyId` is the writer id: form_to_prompt is `teamMode: individual` (HLN-005),
// so the aggregate's per-key idempotency guard is keyed per participant, exactly
// like a Quiz answer.

/**
 * Persist a finished path.
 *
 * `prompt` is passed in rather than re-assembled here. It is what the
 * participant actually copied into Gemini; if an author later edits a template,
 * the recap must still show the prompt that was really used, and re-running the
 * assembly against a newer config cannot promise that.
 */
export async function submitFormToPromptAnswer(opts: {
  sessionId: string
  writerId: string
  phaseId: string
  answer: FormToPromptAnswerValue
}): Promise<void> {
  const { sessionId, writerId, phaseId, answer } = opts
  await submitAnswer({
    sessionId,
    playerId: writerId,
    keyId: writerId,
    qId: phaseId,
    value: answer,
  })
}
