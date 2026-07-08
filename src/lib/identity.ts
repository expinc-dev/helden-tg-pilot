// Per-device, per-session identity. Survives refresh so a player/central isn't
// re-registered as a new RTDB node on reload (grill Q1-Q4).
type Role = 'player' | 'central'
export type Stored = { id: string; name?: string }

const key = (sessionId: string, role: Role) =>
  `tg-${role === 'player' ? 'pid' : 'cid'}-${sessionId}`

export function loadIdentity(sessionId: string, role: Role): Stored | null {
  const raw = localStorage.getItem(key(sessionId, role))
  if (!raw) return null
  try {
    return JSON.parse(raw) as Stored
  } catch {
    return null
  }
}

export function saveIdentity(sessionId: string, role: Role, v: Stored) {
  localStorage.setItem(key(sessionId, role), JSON.stringify(v))
}
