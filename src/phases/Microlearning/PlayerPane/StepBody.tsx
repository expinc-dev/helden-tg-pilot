import type { Block, Phase } from '@helden-inc/tg-schema'

import { renderInline, renderNumberedList, renderRichText } from '@/lib/richText'

import { BlockView } from './Blocks'

// A step's own content: if it opens with an image block, that image renders
// as a hero — either "bleed" (Presentation's projected-slide treatment:
// edge-to-edge fill with gradient + corner accent + heading overlay) or
// "contained" (Microlearning's step card: 4:3 rounded frame, no overlays,
// title + numbered caption stacked below the image). Non-image leading
// blocks flow in the normal padded column either way.
//
// Microlearning paginates one block per screen, so PlayerPane passes a
// single-element array. Presentation slides carry many blocks per slide.
// Either way this component takes Block[] and renders the whole array in one
// scroll column.
export function StepBody({
  stepId,
  blocks,
  header,
  answers,
  drafts,
  onDraftChange,
  disabled,
  sessionId,
  phase,
  playerId,
  fullBleed = false,
  imageVariant = 'bleed',
}: {
  stepId: string
  blocks: Block[]
  header: React.ReactNode
  answers: Record<number, unknown>
  drafts: Record<number, unknown>
  onDraftChange: (index: number, value: unknown) => void
  disabled: boolean
  // Only consumed by 'question' blocks whose qType is qr_scan/pattern_scan
  // (see QuestionView.tsx) — Presentation's read-only slide viewer passes
  // these through too but always with disabled=true, so a scan question
  // embedded in a slide (unsupported content, but the Block union doesn't
  // forbid it) just never becomes interactive there.
  sessionId: string
  phase: Phase
  playerId: string
  // Presentation's central/host screen wants the hero to fill the whole
  // available height (a projected slide), not the fixed-height card treatment
  // Microlearning's scrolling step view uses — only meaningful when
  // imageVariant='bleed'.
  fullBleed?: boolean
  // 'bleed' (default) = Presentation-style edge-to-edge hero with overlays.
  // 'contained' = Microlearning's design: 4:3 rounded frame with padded
  // margins, no gradient/triangle/heading overlays, title + numbered caption
  // rendered below the image.
  imageVariant?: 'bleed' | 'contained'
}) {
  const hero = blocks[0]?.kind === 'image' ? blocks[0] : undefined
  const rest = hero ? blocks.slice(1) : blocks
  const restOffset = hero ? 1 : 0

  // Only the first heading gets pulled onto the hero image as an overlay
  // badge — a second one (rare) just falls through and renders inline via
  // BlockView's plain fallback. Contained variant has no overlay, so the
  // heading always stays inline.
  const heroHeadingIndex =
    hero && imageVariant === 'bleed' ? rest.findIndex((b) => b.kind === 'heading') : -1
  const heroHeading =
    heroHeadingIndex >= 0
      ? (rest[heroHeadingIndex] as Extract<Block, { kind: 'heading' }>)
      : undefined

  return (
    <>
      {hero &&
        (imageVariant === 'contained' ? (
          <ContainedHeroImage block={hero} />
        ) : (
          <HeroImage block={hero} heading={heroHeading?.text} fullBleed={fullBleed} />
        ))}
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {header}
        {rest.map((block, i) => {
          if (i === heroHeadingIndex) return null
          return (
            <BlockView
              // Keyed by step id, not just position — forces a remount when the
              // step changes even if a different block type lands at the same
              // index, which is what keeps QuestionView's internal draft state
              // (single_choice vs. multi_choice, etc.) from leaking across steps.
              key={`${stepId}-${restOffset + i}`}
              block={block}
              answer={answers[restOffset + i] ?? null}
              draft={drafts[restOffset + i]}
              onDraftChange={(value) => onDraftChange(restOffset + i, value)}
              disabled={disabled}
              sessionId={sessionId}
              phase={phase}
              playerId={playerId}
            />
          )
        })}
      </div>
    </>
  )
}

// The card wrapper (StepShell, in index.tsx) has no padding of its own and
// clips to its rounded corners, so this just needs to fill the width — no
// negative-margin trick needed to escape a parent's padding anymore.
function HeroImage({
  block,
  heading,
  fullBleed,
}: {
  block: Extract<Block, { kind: 'image' }>
  heading?: string
  fullBleed?: boolean
}) {
  return (
    <>
      <div
        className={fullBleed ? 'relative min-h-0 flex-1' : 'relative h-[42vh] min-h-72 shrink-0'}
      >
        <img src={block.url} alt={block.caption ?? ''} className="size-full object-cover" />
        {/* Solid dark base for a good stretch at the bottom (not just a thin
        fade) so the caption stays legible regardless of how bright the photo
        itself is at that spot. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, #121212 0%, rgba(0,0,0,0.85) 22%, rgba(0,0,0,0.35) 45%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-0 left-0 size-10"
          style={{ background: '#FFB800', clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        />
        {heading && (
          <div
            className="absolute top-4 right-4 rounded border px-3 py-1.5"
            style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.6)' }}
          >
            <p className="text-sm font-semibold text-[#FFB800]">{heading}</p>
          </div>
        )}
        {block.caption && (
          <div className="absolute bottom-3 left-4 text-xs text-white/70">
            {renderRichText(block.caption)}
          </div>
        )}
      </div>
      {/* title is a headline BELOW the image, not an overlay on top of it —
      distinct from `heading` (badge overlay) and `caption` (small overlay
      note), see the field comment in helden-tg-schema's blocks.ts. */}
      {block.title && (
        <p className="px-4 pt-4 text-center text-lg font-bold text-[#FFB800] sm:px-6">
          {renderInline(block.title)}
        </p>
      )}
    </>
  )
}

// Microlearning variant: image sits in a 4:3 rounded frame with padded
// margins, title centered gold below the image, caption below the title as a
// numbered gold-circle list. Falls back to plain paragraph rendering when
// the caption has no bullet lines.
function ContainedHeroImage({ block }: { block: Extract<Block, { kind: 'image' }> }) {
  return (
    <div className="flex flex-col gap-5 px-4 pt-4 sm:px-6 sm:pt-6">
      <div
        className="aspect-[4/3] w-full overflow-hidden rounded-2xl border"
        style={{ borderColor: '#353535', background: '#111' }}
      >
        <img
          src={block.url}
          alt={block.caption ?? block.title ?? ''}
          className="size-full object-cover"
        />
      </div>
      {block.title && (
        <p className="text-center text-2xl font-bold text-[#FFB800] sm:text-3xl">
          {renderInline(block.title)}
        </p>
      )}
      {block.caption && (
        <div>
          {renderNumberedList(block.caption, { itemTextClassName: 'text-base sm:text-lg' })}
        </div>
      )}
    </div>
  )
}
