// 6-char alphanumeric, no ambiguous chars (0/O, 1/I/L). Human-typeable.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function newJoinCode(): string {
  let out = ''
  const buf = new Uint32Array(6)
  crypto.getRandomValues(buf)
  for (let i = 0; i < 6; i++) out += ALPHABET[buf[i] % ALPHABET.length]
  return out
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
}
