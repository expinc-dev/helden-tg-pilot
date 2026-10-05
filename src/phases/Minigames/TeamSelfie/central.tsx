import { CentralGalleryFrame } from '@/components/CentralGalleryFrame'
import type { Phase } from '@helden-inc/tg-schema'

import { BENTO_CAPACITY, type Layout, layoutForCount, pageForTick, paginate } from './grid'
import type { TeamSelfieConfig } from './score'
import { useAllSelfies } from './useSelfies'
import { useTick } from './useTick'

const ROTATE_MS = 6000

// Central gallery (HLN-018). Full-bleed by design — pages/central/screen
// special-cases this template so the standard padding/debug chrome is skipped
// and the mosaic can use the whole wall.
//
// Composition follows the "Gallery - Central Screen" Figma frame (944:2408):
// 16px-radius container on #080808, a gradient-text hero line, an optional
// subtitle, then the bento mosaic. No player or team names appear anywhere —
// that is an explicit acceptance criterion, so do not add labels here.
export function TeamSelfieCentral({
  sessionId,
  config,
}: {
  phase: Phase
  sessionId: string
  config: TeamSelfieConfig
}) {
  const selfies = useAllSelfies(sessionId)
  const tick = useTick(ROTATE_MS)
  const pages = paginate(selfies, BENTO_CAPACITY)
  const page = pages[pageForTick(tick, pages.length)]
  const layout = layoutForCount(page.length)

  return (
    <CentralGalleryFrame title={config.finalLine} subtitle={config.caption || undefined}>
      <div className="min-h-0 flex-1">
        {page.length === 0 ? (
          <EmptyGallery />
        ) : (
          <Mosaic layout={layout} images={page.map((s) => s.image!)} />
        )}
      </div>
    </CentralGalleryFrame>
  )
}

// CSS grid built from the pure layout maths in grid.ts: every tile knows its
// own column/row start and span, so both the 5-photo bento and the uniform
// fallback render through this one component.
function Mosaic({ layout, images }: { layout: Layout; images: string[] }) {
  return (
    <div
      className="grid size-full gap-5"
      style={{
        gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
      }}
    >
      {layout.tiles.map((tile, i) => (
        <div
          key={i}
          className="bg-helden-photo-gradient relative overflow-hidden rounded-2xl border-2 border-[#353535]"
          style={{
            gridColumn: `${tile.col + 1} / span ${tile.colSpan}`,
            gridRow: `${tile.row + 1} / span ${tile.rowSpan}`,
          }}
        >
          {images[i] && <img src={images[i]} alt="" className="size-full object-cover" />}
          {/* Figma lays the surface gradient over each photo, which is what
              keeps the mosaic visually cohesive across mismatched exposures. */}
          <div className="bg-helden-surface-gradient pointer-events-none absolute inset-0 opacity-30" />
        </div>
      ))}
    </div>
  )
}

function EmptyGallery() {
  return (
    <div className="bg-helden-photo-gradient/40 flex size-full flex-col items-center justify-center gap-4 rounded-2xl text-center">
      <p className="text-helden-body text-2xl font-light">Menunggu foto tim pertama…</p>
    </div>
  )
}
