import type { Phase } from '@helden-inc/tg-schema'

import { GalleryBoard } from './board'
import type { DoubtSeedConfig } from './score'

// Host view for doubt_seed (HLN-003): the same contrast the room is looking at,
// inside the host shell's own panel rather than the central's full-bleed frame.
//
// The storyboard's host job here is to talk over the board ("yang generik bisa
// jadi toko siapa aja; yang ini cuma bisa jadi Bu Sari"), so the host needs to
// see what the room sees. Anything richer — pinning versions, reordering pages —
// would need session state the gallery deliberately does not keep.
export function HostDoubtSeed({
  sessionId,
  phase,
  config,
}: {
  sessionId: string
  phase: Phase
  config: DoubtSeedConfig
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <GalleryBoard sessionId={sessionId} phase={phase} config={config} />
    </div>
  )
}
