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
    <div className="bg-helden-base fixed inset-0 flex items-center justify-center p-11">
      <div className="relative flex size-full max-h-[929px] max-w-[1832px] flex-col gap-10 rounded-2xl bg-[#080808] p-8">
        {phase.title && (
          <header className="text-center">
            <h1 className="bg-helden-yellow-gradient bg-clip-text text-[54px] leading-[74px] font-bold tracking-[-2.16px] text-transparent">
              {phase.title}
            </h1>
          </header>
        )}
        <GalleryBoard sessionId={sessionId} phase={phase} config={config} />
      </div>
    </div>
  )
}
