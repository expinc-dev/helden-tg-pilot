// Pointer "role + sessionId terakhir" di localStorage, supaya host yang keluar
// atau reload di /host/new bisa kembali ke sesi yang sedang berjalan. Sengaja
// terpisah dari lib/identity.ts (yang per-device/per-session untuk central &
// player) — ini cuma satu pointer global.
const ROLE_KEY = 'joinAsRole'
const SESSION_KEY = 'sessionId'

export type ReconnectRole = 'host' | 'central' | 'player'

export function saveReconnect(role: ReconnectRole, sessionId: string) {
  try {
    localStorage.setItem(ROLE_KEY, role)
    localStorage.setItem(SESSION_KEY, sessionId)
  } catch {
    // localStorage bisa throw di konteks private/diblokir — reconnect cuma
    // kemudahan, jangan sampai menggagalkan alur create/join yang sebenarnya.
  }
}

export function loadReconnect(role: ReconnectRole): string | null {
  try {
    if (localStorage.getItem(ROLE_KEY) !== role) return null
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function clearReconnect() {
  try {
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* lihat catatan di saveReconnect */
  }
}
