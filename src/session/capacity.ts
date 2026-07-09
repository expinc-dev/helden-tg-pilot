export type Member = { connected?: boolean }

// Pure capacity rule for the join transaction — no RTDB, unit-testable.
// See presence.selfcheck.ts. Returns the next collection state, or `undefined`
// to abort the transaction (session full). Counts connected members only, so a
// disconnected slot is reclaimable — consistent with usePresenceCounts.
export function reserveSlot(
  members: Record<string, Member> | null,
  id: string,
  max: number
): Record<string, Member> | undefined {
  const m = members ?? {}
  if (m[id]) return m // rejoin: slot already ours, never consume a new one
  const connected = Object.values(m).filter((v) => v?.connected !== false).length
  if (connected >= max) return undefined // full → abort
  return { ...m, [id]: { connected: true } } // reserve; full fields written after commit
}
