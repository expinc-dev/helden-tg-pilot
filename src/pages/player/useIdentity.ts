import { useEffect, useState } from 'react'

import { loadIdentity, saveIdentity } from '@/lib/identity'
import { newId } from '@/lib/ids'
import { findPlayerIdByName } from '@/lib/session/presence'

export type Identity = { id: string; name?: string; isNew: boolean }

// Resolves who this device is for this session + typed name. In order:
//  1. Stored identity for this session matches the typed name (or none was
//     typed) → rejoin via the device's own memory. No network needed.
//  2. Typed name differs from what's stored (or nothing's stored yet), but a
//     player with that exact name already exists in the session (one RTDB
//     read) → rejoin THAT player instead of minting a new, empty-progress one.
//     Covers: this device already has a DIFFERENT identity remembered for this
//     session (its single localStorage slot got overwritten by that other
//     name), but the original player is still very much alive in RTDB.
//  3. Neither → genuinely new player, fresh id.
// Returns null while unresolved (mount only — case 2 needs one network round
// trip; 1 and 3 are synchronous but still flow through the same effect so
// callers get one stable shape either way).
export function useResolvedIdentity(
  sessionId: string | undefined,
  typedName: string | undefined
): Identity | null {
  const [identity, setIdentity] = useState<Identity | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const sid = sessionId
    let cancelled = false

    async function resolve() {
      const stored = loadIdentity(sid, 'player')
      if (stored && (!typedName || typedName === stored.name)) {
        if (!cancelled) setIdentity({ id: stored.id, name: stored.name, isNew: false })
        return
      }

      const existingId = typedName ? await findPlayerIdByName(sid, typedName) : null
      if (cancelled) return

      const id = existingId ?? newId('p')
      saveIdentity(sid, 'player', { id, name: typedName })
      setIdentity({ id, name: typedName, isNew: !existingId })
    }

    void resolve()
    return () => {
      cancelled = true
    }
  }, [sessionId, typedName])

  return identity
}
