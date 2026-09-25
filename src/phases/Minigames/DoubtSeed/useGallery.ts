import { useEffect, useState } from 'react'

import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'
import { usePlayerOwners } from '@/lib/sync/usePlayerOwners'
import { usePresence } from '@/lib/sync/useSession'
import { useTeams } from '@/lib/sync/useTeams'

import { type GalleryEntry, galleryEntries } from './gallery'

export type GalleryAnswer = { value: string[]; submittedAt?: number; shared?: boolean }

/**
 * Who has a version in this gallery, plus where their submission lives. One row
 * per team in team modes (the leader's answers node, matching how the player
 * renderer writes), one row per player otherwise — the same split as
 * SortOrder/lib.ts#useSortOrderRoster.
 *
 * The session-wide teams/presence reads are host/central concerns by design
 * (see the notes on usePresence); this hook is only ever mounted by the central
 * and host renderers. A player's own screen builds the same roster from
 * `playerOwners` — ids only, no presence — instead.
 */
export function useGalleryRoster(
  sessionId: string | undefined,
  phase: { teamMode?: string }
): GalleryEntry[] {
  const teams = useTeams(sessionId)
  const { players } = usePresence(sessionId)
  return galleryEntries(phase, teams, Object.keys(players))
}

/**
 * The same roster for a player's own phone (HLN-003), where the gallery is the
 * post-submit screen.
 *
 * useGalleryRoster is off limits there: it reads presence, which is documented
 * as host/central-only. So the participant set comes from `playerOwners` — the
 * flat uid map claimOwnership already maintains, readable by any signed-in
 * client and carrying no names at all. In an individual session its keys are
 * the players; in a team session `galleryEntries` uses the teams instead, which
 * this hook still reads (one row per team, not per member).
 */
export function usePlayerGalleryRoster(
  sessionId: string | undefined,
  phase: { teamMode?: string }
): GalleryEntry[] {
  const teams = useTeams(sessionId)
  const owners = usePlayerOwners(sessionId)
  return galleryEntries(phase, teams, Object.keys(owners))
}

/**
 * Narrow per-writer read of the answers the gallery displays — one listener per
 * roster row, never one on `players/` broadly (same scoping rule as
 * SortOrder/lib.ts#useSortOrderAnswers). The dependency is the joined writer
 * list so a team joining or leaving re-subscribes exactly once.
 *
 * `shared` is the `optional` mode's keep-private flag (see score.ts). It is
 * passed through as-is — `undefined` for every answer written before HLN-003,
 * which submittedGalleryEntries reads as "on the wall".
 */
export function useGalleryAnswers(
  sessionId: string | undefined,
  roster: GalleryEntry[],
  phaseId: string
): Record<string, GalleryAnswer | undefined> {
  const [answers, setAnswers] = useState<Record<string, GalleryAnswer | undefined>>({})
  const writerKey = roster.map((r) => r.writerId).join(',')

  useEffect(() => {
    if (!sessionId) return
    const unsubs = roster.map((r) =>
      onValue(eref(`sessions/${sessionId}/players/${r.writerId}/answers/${phaseId}`), (s) => {
        const v = s.val()
        setAnswers((prev) => ({
          ...prev,
          [r.writerId]:
            v && Array.isArray(v.value)
              ? { value: v.value, submittedAt: v.submittedAt, shared: v.shared }
              : undefined,
        }))
      })
    )
    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, writerKey, phaseId])

  return answers
}
