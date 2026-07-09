// 6-char alphanumeric, no ambiguous chars (0/O, 1/I/L). Human-typeable.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function newJoinCode(): string {
  let out = ''
  const buf = new Uint32Array(6)
  crypto.getRandomValues(buf)
  for (let i = 0; i < 6; i++) out += ALPHABET[buf[i] % ALPHABET.length]
  return out
}

// crypto.getRandomValues (not crypto.randomUUID) so ids also generate in a
// non-secure context — e.g. a phone hitting the dev server over http://<LAN-ip>.
// randomUUID is secure-context-only and throws there, crashing the join flow.
export function newId(prefix: string): string {
  const buf = new Uint8Array(4)
  crypto.getRandomValues(buf)
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${prefix}_${hex}`
}
