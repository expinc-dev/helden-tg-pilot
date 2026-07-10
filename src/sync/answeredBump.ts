// Pure aggregate updater — the runTransaction body with all Firebase concerns
// stripped, so both the tx (submitAnswer.ts) and the race self-check can share
// it. Idempotent per (qId, keyId): repeated apply with same key returns an equal
// value, so the tx never over-counts. keyId is playerId in individual mode and
// teamId in team modes — 3 devices in the same team = 1 count.

export interface AnsweredNode {
  answeredCount?: Record<string, number>
  answeredBy?: Record<string, Record<string, true>>
}

export function bumpAnswered(prev: AnsweredNode | null, qId: string, keyId: string): AnsweredNode {
  const next: AnsweredNode = {
    answeredCount: { ...(prev?.answeredCount ?? {}) },
    answeredBy: {
      ...(prev?.answeredBy ?? {}),
      [qId]: { ...(prev?.answeredBy?.[qId] ?? {}) },
    },
  }
  if (next.answeredBy![qId][keyId]) return next
  next.answeredBy![qId][keyId] = true
  next.answeredCount![qId] = (next.answeredCount![qId] ?? 0) + 1
  return next
}
