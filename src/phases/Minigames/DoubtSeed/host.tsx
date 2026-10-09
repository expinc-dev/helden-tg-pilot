import type { Phase } from '@helden-inc/tg-schema'

import { GalleryBoard } from './board'
import type { DoubtSeedConfig } from './score'

// Host view for doubt_seed: the teams' arrangements, for the facilitator only.
// The central no longer shows them (it only shows "Kemajuan Tim"), so there is
// nothing to curate/pin any more — the host just reads what each team sent while
// talking the room through it.
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
      <GalleryBoard sessionId={sessionId} phase={phase} config={config} compact />
    </div>
  )
}
