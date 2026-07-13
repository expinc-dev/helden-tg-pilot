// Pure code-match rules for the codeinput puzzle. No RTDB — unit-testable
// (see codecheck.selfcheck.ts).

// Trims surrounding whitespace; case-fold unless caseSensitive. Empty string
// normalizes to '' (never a valid match — see checkCode).
//
// The host uses this to seed sessions/{id}/secrets/{phaseId} when a codeinput
// phase opens, and the player uses it on their own guess before submitting —
// both sides normalize identically, so the RTDB rule that actually decides
// correctness (comparing the two normalized strings) can use a plain `===`
// instead of re-implementing trim/case-fold in rules syntax.
export function normalizeCode(s: string, caseSensitive = false): string {
  const t = s.trim()
  return caseSensitive ? t : t.toLowerCase()
}

// Client-side-only preview check (used nowhere security-relevant anymore — the
// real decision is the RTDB rule comparing against secrets/{phaseId}, which the
// player's client never reads). Kept for any future offline/preview UI.
export function checkCode(input: string, expected: string, caseSensitive = false): boolean {
  const a = normalizeCode(input, caseSensitive)
  if (!a) return false
  return a === normalizeCode(expected, caseSensitive)
}
