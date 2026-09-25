import { useEffect, useMemo, useState } from 'react'

import type { PublishedGame } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'
import {
  type Seed,
  type SeedSpec,
  buildSeeds,
  mergeSeedAnswer,
  seedQIds,
} from '@/lib/session/seeds'

// The read path HLN-002 adds: a participant's own earlier answers, live.
//
// Reads events/{EVENT_ID}/sessions/{sessionId}/players/{playerId}/answers/{qId}
// — one `onlyOnce` listener per qId, the pattern Reflection/player and
// Presentation/PlayerPane already use for their own node. In-scope because
// `sessions/$sid/players` is `.read: "auth != null"`: a player may read their
// own seat, and by extension an earlier phase's answer inside it. No new RTDB
// node, no rule change.
//
// Own-node-only on purpose. `usePresence` (the whole players/ tree) is
// host/central-only by contract because it carries every participant's name —
// a player screen must never mount it. This hook subscribes to one seat, one
// answer key at a time.
export function useSeeds(
  sessionId: string | undefined,
  playerId: string | undefined,
  specs: SeedSpec[],
  bundle?: PublishedGame
): Seed[] {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})

  // A caller may pass a fresh array literal every render, so the effect keys on
  // a primitive join of the qIds instead of the array identity — otherwise every
  // render would tear down and re-create the listeners. qIds are UUID-derived
  // and comma-free, so the join is unambiguous.
  const qIdKey = seedQIds(specs).join(',')

  useEffect(() => {
    if (!sessionId || !playerId || !qIdKey) return
    const unsubs = qIdKey.split(',').map((qId) =>
      // eref(), like every other reader of this node (Reflection/player,
      // Presentation/PlayerPane) and like the writer (lib/sync/submitAnswer.ts).
      // A bare ref(rtdb, 'sessions/…') would read the RTDB root instead of the
      // events/{EVENT_ID}/ subtree and return nothing, with no error — the
      // bundle's gameId is part of the path, so it cannot be reconstructed here.
      onValue(
        eref(`sessions/${sessionId}/players/${playerId}/answers/${qId}`),
        (snap) => setAnswers((prev) => mergeSeedAnswer(prev, qId, snap.val())),
        { onlyOnce: true }
      )
    )
    return () => unsubs.forEach((u) => u())
  }, [sessionId, playerId, qIdKey])

  // `specs` is a real input (a different spec set is a different list of
  // seeds), so a caller that builds a fresh array each render pays for one
  // rebuild of a handful of objects. Unlike the effect, the memo must key on
  // the array itself: reusing the qId string here would not notice a changed
  // answer mapping between two specs that read the same keys. `bundle` is a
  // module-level constant in practice, but it is an argument, so it belongs.
  return useMemo(() => buildSeeds(bundle, answers, specs), [bundle, answers, specs])
}
