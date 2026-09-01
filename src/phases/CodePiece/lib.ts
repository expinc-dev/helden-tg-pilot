import { useEffect, useState } from 'react'

import type { CodePieceContent } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

// Frozen at phase-open (control.ts#openPhaseFragmentOrder) — room-scoped
// when there's no teamId to scope to, per-team otherwise. Mirrors
// CodeInput/lib.ts's team-vs-room path split.
export function useFragmentOrder(
  sessionId: string,
  phaseId: string,
  teamId: string | undefined
): string[] {
  const [order, setOrder] = useState<string[]>([])
  useEffect(() => {
    const path = teamId
      ? `sessions/${sessionId}/teams/${teamId}/codepiece/${phaseId}/fragmentOrder`
      : `sessions/${sessionId}/codepiece/${phaseId}/fragmentOrder`
    return onValue(eref(path), (s) => setOrder(Array.isArray(s.val()) ? s.val() : []))
  }, [sessionId, teamId, phaseId])
  return order
}

// Pure — the entire point of freezing fragmentOrder is that resolving "which
// fragment is mine" never needs to read or write anything else, so it's
// automatically reconnect-stable. `position` is this player's index in the
// frozen order (order.indexOf(playerId), computed by the caller).
//
// Distribution modes (tg-schema's CodePieceContent.distribution — decided
// here since the schema left the exact mechanics to the runtime):
//   - 'by_index'    fragments[position] directly. 1:1 — author fragment
//                    count should match roster size; a player beyond the
//                    fragment count simply gets none (still sees everyone
//                    else's progress via the monitor).
//   - 'round_robin' fragments[position % fragments.length] — wraps so every
//                    position gets SOMETHING even with more players than
//                    fragments (some fragments repeat across players).
//   - 'fixed'       fragment.assignTo holds the target position as a string
//                    ("0", "1", ...) — author-pinned rather than order-derived.
export function fragmentForPosition(
  content: CodePieceContent,
  position: number
): { fragment: CodePieceContent['fragments'][number]; index: number } | null {
  const { fragments, distribution } = content
  if (fragments.length === 0 || position < 0) return null

  if (distribution === 'fixed') {
    const index = fragments.findIndex((f) => f.assignTo === String(position))
    return index >= 0 ? { fragment: fragments[index], index } : null
  }
  if (distribution === 'round_robin') {
    const index = position % fragments.length
    return { fragment: fragments[index], index }
  }
  // by_index
  return position < fragments.length ? { fragment: fragments[position], index: position } : null
}

// Where this fragment sits within the WHOLE assembled code — derived purely
// from the fragments array's own concatenation order + lengths, no separate
// "expected code" reference needed. Lets the player see the full slot count
// with only their own letters filled in (e.g. "H E L - - -"), not an
// isolated string with no sense of where it fits or how long the whole
// code is.
export function fragmentSlots(
  content: CodePieceContent,
  index: number
): { totalLength: number; offset: number; value: string } {
  const totalLength = content.fragments.reduce((sum, f) => sum + f.value.length, 0)
  const offset = content.fragments.slice(0, index).reduce((sum, f) => sum + f.value.length, 0)
  return { totalLength, offset, value: content.fragments[index].value }
}
