// Pure roster rule for the maxMembers transaction — no RTDB, unit-testable
// (see teams.selfcheck.ts). Mirrors session/capacity.ts#reserveSlot but for a
// team's memberIds map. Returns the next map, or `undefined` to abort the
// transaction (team full). Idempotent: re-adding an existing member is a no-op,
// so reconnect / re-scanning the invite QR never double-adds or double-counts.
//
// Map, not array (tg-schema 2.0.0) — a per-key write is the only shape RTDB
// security rules can validate without numChildren()/.length/indexing, none of
// which exist in the rules language (confirmed against the live Rules
// Playground). See database.rules.json's teams/$teamId/memberIds rule.
export function addMember(
  memberIds: Record<string, true> | null,
  playerId: string,
  max: number
): Record<string, true> | undefined {
  const map = memberIds ?? {}
  if (map[playerId]) return map // already a member
  if (Object.keys(map).length >= max) return undefined // full → abort
  return { ...map, [playerId]: true }
}
