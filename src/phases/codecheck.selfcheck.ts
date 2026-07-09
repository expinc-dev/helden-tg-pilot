// Runnable self-check for checkCode. No test runner / node types needed:
//   npx tsx src/phases/codecheck.selfcheck.ts
// Excluded from the app build (tsconfig.app.json).
import { checkCode } from './codecheck'

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

ok(checkCode('helden', 'HELDEN') === true, 'case-insensitive by default')
ok(checkCode('  helden  ', 'helden') === true, 'trims whitespace')
ok(checkCode('helden', 'HELDEN', true) === false, 'caseSensitive rejects case mismatch')
ok(checkCode('HELDEN', 'HELDEN', true) === true, 'caseSensitive exact match')
ok(checkCode('', 'helden') === false, 'empty input never matches')
ok(checkCode('wrong', 'helden') === false, 'wrong code rejected')

console.log('codecheck.selfcheck: OK')
