// Runnable self-check for checkCode. No test runner / node types needed:
//   npx tsx src/phases/codecheck.selfcheck.ts
// Excluded from the app build (tsconfig.app.json).
import { checkCode, normalizeCode } from './codecheck'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}
const eq = (a: string, b: string, msg: string) => ok(a === b, `${msg} (got "${a}", want "${b}")`)

ok(checkCode('helden', 'HELDEN') === true, 'case-insensitive by default')
ok(checkCode('  helden  ', 'helden') === true, 'trims whitespace')
ok(checkCode('helden', 'HELDEN', true) === false, 'caseSensitive rejects case mismatch')
ok(checkCode('HELDEN', 'HELDEN', true) === true, 'caseSensitive exact match')
ok(checkCode('', 'helden') === false, 'empty input never matches')
ok(checkCode('wrong', 'helden') === false, 'wrong code rejected')

// normalizeCode is what host (seeding secrets/{phaseId}) and player (guess)
// both call — they MUST agree exactly, or the RTDB rule's plain `===` compare
// would reject a guess that a human would call correct.
eq(normalizeCode('  HELDEN  '), 'helden', 'default: trims + lowercases')
eq(normalizeCode('  HELDEN  ', true), 'HELDEN', 'caseSensitive: trims only')
ok(
  normalizeCode('helden') === normalizeCode('  HeLdEn  '),
  'host seed and a sloppy-but-correct guess normalize identically'
)

console.log('codecheck.selfcheck: OK')
