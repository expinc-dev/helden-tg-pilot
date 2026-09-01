import { hammingDistance } from './patternHash'

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`FAIL ${label}: expected ${expected}, got ${actual}`)
}

assertEqual(hammingDistance(0n, 0n), 0, 'identical hashes have distance 0')
assertEqual(hammingDistance(0b1111n, 0b0000n), 4, '4 differing bits')
assertEqual(hammingDistance(0b1010n, 0b0101n), 4, 'fully inverted 4-bit values')
assertEqual(hammingDistance(0xffffffffffffffffn, 0n), 64, 'fully inverted 64-bit values')

console.log('OK')
