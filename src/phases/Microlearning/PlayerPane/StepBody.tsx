import type { Block } from '@helden-inc/tg-schema'

import { BlockView } from './Blocks'

// A step's own content: if it opens with an image block, that image renders
// as a hero bleeding to the step card's own edges (gradient fade, corner
// accent) with the rest of the blocks flowing normally, padded, below it —
// otherwise every block just flows in the normal padded column.
export function StepBody({
  stepId,
  blocks,
  header,
  answers,
  drafts,
  onDraftChange,
  disabled,
}: {
  stepId: string
  blocks: Block[]
  header: React.ReactNode
  answers: Record<number, unknown>
  drafts: Record<number, unknown>
  onDraftChange: (index: number, value: unknown) => void
  disabled: boolean
}) {
  const hero = blocks[0]?.kind === 'image' ? blocks[0] : undefined
  const rest = hero ? blocks.slice(1) : blocks
  const restOffset = hero ? 1 : 0

  return (
    <>
      {hero && <HeroImage block={hero} />}
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {header}
        {rest.map((block, i) => (
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
          />
        ))}
      </div>
    </>
  )
}

// The card wrapper (StepShell, in index.tsx) has no padding of its own and
// clips to its rounded corners, so this just needs to fill the width — no
// negative-margin trick needed to escape a parent's padding anymore.
function HeroImage({ block }: { block: Extract<Block, { kind: 'image' }> }) {
  return (
    <div className="relative h-[42vh] min-h-72 shrink-0">
      <img src={block.mediaId} alt={block.caption ?? ''} className="size-full object-cover" />
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
      {block.caption && (
        <p className="absolute bottom-3 left-4 text-xs text-white/70">{block.caption}</p>
      )}
    </div>
  )
}
