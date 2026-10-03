import { CentralGalleryFrame } from '@/components/CentralGalleryFrame'
import type { Phase } from '@helden-inc/tg-schema'

import { GalleryBoard } from './board'
import type { DoubtSeedConfig } from './score'

// Central gallery (HLN-003, storyboard §7). Full-bleed by design — the central
// screen special-cases this template so the standard padding/timer chrome is
// skipped and the contrast can use the whole wall.
export function DoubtSeedCentral({
  sessionId,
  phase,
  config,
}: {
  sessionId: string
  phase: Phase
  config: DoubtSeedConfig
}) {
  return (
    <CentralGalleryFrame title={phase.title || undefined}>
      <GalleryBoard sessionId={sessionId} phase={phase} config={config} />
    </CentralGalleryFrame>
  )
}
