import { useEffect, useState } from 'react'

import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

// The host's curation for the doubt_seed gallery (HLN-003): the gallery entry
// keys currently pinned to the central screen, in pin order. Empty means "no
// curation — the central rotates through its pages instead".
//
// It rides on the existing centralStep node: its own rule is already
// host-only for writes and public for reads, with no sub-validate, so a child
// leaf costs no new RTDB node and no new security rule. openPhase() removes the
// whole node on every phase change, so a pin can never outlive its phase.
//
// Read-only by design — the write side is setGallerySpotlight() in
// lib/session/control.ts, and only the host screen calls it.
export function useGallerySpotlight(sessionId: string | undefined): string[] {
  const [keys, setKeys] = useState<string[]>([])

  useEffect(() => {
    if (!sessionId) return
    return onValue(eref(`sessions/${sessionId}/centralStep/gallery`), (s) => {
      const v = s.val()
      // Anything else (a number, a nested node, a stale shape from an older
      // writer) degrades to "nothing pinned" rather than crashing a screen the
      // whole room is looking at.
      setKeys(Array.isArray(v) ? v.filter((k): k is string => typeof k === 'string') : [])
    })
  }, [sessionId])

  return keys
}
