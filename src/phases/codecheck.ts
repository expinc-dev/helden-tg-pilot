// Pure code-match rule for the codeinput puzzle. No RTDB — unit-testable
// (see codecheck.selfcheck.ts). Trims surrounding whitespace; case-fold unless
// caseSensitive. Empty input never matches.
export function checkCode(input: string, expected: string, caseSensitive = false): boolean {
  const norm = (s: string) => {
    const t = s.trim()
    return caseSensitive ? t : t.toLowerCase()
  }
  const a = norm(input)
  if (!a) return false
  return a === norm(expected)
}
