// Pure roster rule for the maxMembers transaction — no RTDB, unit-testable
// (see teams.selfcheck.ts). Mirrors session/capacity.ts#reserveSlot but for a
// team's memberIds[] array. Returns the next array, or `undefined` to abort the
// transaction (team full). Idempotent: re-adding an existing member is a no-op,
// so reconnect / re-scanning the invite QR never double-adds or double-counts.
export function addMember(
  memberIds: string[] | null,
  playerId: string,
  max: number
): string[] | undefined {
  const list = memberIds ?? []
  if (list.includes(playerId)) return list // already a member
  if (list.length >= max) return undefined // full → abort
  return [...list, playerId]
}
