import type { CommitmentAnswerValue } from '@/phases/Minigames/Commitment/score'

import { submitAnswer } from '@/lib/sync/submitAnswer'

// The one writer for a commitment answer:
// `sessions/{id}/players/{writerId}/answers/{phaseId}`.
//
// Same reasoning as lib/session/formToPrompt.ts: component-local state (which
// half is being typed, whether the submit is in flight) stays in the component,
// only the persisted shape lives here, and the answer node therefore has exactly
// one definition that the scorer and any reader share.
//
// Goes through `submitAnswer` rather than a bare `set` so
// `aggregates/answeredCount/{phaseId}` rises — the closing central screen shows
// a neutral "berapa yang sudah mengirim" and nothing else (storyboard: "Tidak
// tampilkan jawaban siapa pun (privat)"), and `submitAnswer` is the only writer
// that bumps it. Writing the node directly would leave that counter permanently
// at zero, which reads on the wall as "nobody finished" while the room is
// actually done.
//
// `keyId` is the writer id: HLN-014 is `teamMode: individual` and the
// commitment is private, so the per-key idempotency guard is per participant.
// A re-submit after editing is a rolled-back no-op on the aggregate, exactly
// like a Quiz answer — the count stays "how many have finished", not "how many
// writes happened".
//
// The `sentence` the participant confirms is passed in, not re-assembled here;
// see CommitmentAnswerValue for why.

/**
 * Persist a finished commitment.
 */
export async function submitCommitmentAnswer(opts: {
  sessionId: string
  writerId: string
  phaseId: string
  answer: CommitmentAnswerValue
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
