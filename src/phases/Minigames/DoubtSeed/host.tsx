import { useState } from 'react'

import type { Phase } from '@helden-inc/tg-schema'

import { setGallerySpotlight } from '@/lib/session/control'
import { useGallerySpotlight } from '@/lib/sync/useGallerySpotlight'

import { GalleryBoard } from './board'
import { toggleSpotlight } from './gallery'
import type { DoubtSeedConfig } from './score'

// Host view for doubt_seed (HLN-003): the same contrast the room is looking at,
// inside the host shell's own panel rather than the central's full-bleed frame,
// plus the curation strip the central cannot have.
//
// The storyboard's host job here is to talk over the board ("yang generik bisa
// jadi toko siapa aja; yang ini cuma bisa jadi Bu Sari") and to choose which two
// or three versions the room studies. The pins are written to
// centralStep/gallery, so the central follows the host's click on its own read —
// no state is passed between the two screens.
//
// This is a second subscription to the same leaf, on top of the one inside
// GalleryBoard: the toggle maths needs the current list at click time, and a
// prop would mean the board could not read the pins for itself on the central.
// It is one tiny leaf; the duplicate listener is the cheaper of the two designs.
export function HostDoubtSeed({
  sessionId,
  phase,
  config,
}: {
  sessionId: string
  phase: Phase
  config: DoubtSeedConfig
}) {
  const spotlight = useGallerySpotlight(sessionId)
  const [error, setError] = useState<string | null>(null)

  const onToggle = (key: string) => {
    setError(null)
    // Fire-and-forget with a visible failure: the chip strip re-renders from
    // the RTDB read, so a dropped write would otherwise leave the host
    // believing the room is looking at a set that was never stored.
    void setGallerySpotlight(sessionId, toggleSpotlight(spotlight, key)).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : String(e))
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <GalleryBoard sessionId={sessionId} phase={phase} config={config} onToggle={onToggle} />
      {error && <p className="text-sm text-red-400">Kurasi gagal disimpan: {error}</p>}
    </div>
  )
}
