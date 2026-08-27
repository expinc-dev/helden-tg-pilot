import { assets } from '@/assets'
import type { Block, MicrolearningContent } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { parseTextBlock } from './parseTextBlock'

type StepStatus = 'done' | 'available' | 'locked'

// Sequential content locks anything past the current pointer, exactly like
// the host's own level picker (PickerGrid.tsx). Free content has no locking —
// only "done" (already passed) vs "available" (open); it doesn't track a real
// visited-set, so "done" here is an approximation of "at or before your
// current step," not true per-step completion in arbitrary order.
function stepStatus(
  index: number,
  bounded: number,
  mode: MicrolearningContent['mode']
): StepStatus {
  if (index < bounded) return 'done'
  if (index === bounded) return 'available'
  return mode === 'free' ? 'available' : 'locked'
}

export function StepPickerGrid({
  content,
  bounded,
  onSelect,
}: {
  content: MicrolearningContent
  bounded: number
  onSelect: (index: number) => void
}) {
  const total = content.steps.length
  const pct = Math.round((bounded / total) * 100)

  return (
    <div
      className="flex min-h-dvh flex-col bg-cover bg-top p-4 sm:p-6"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto rounded-2xl border p-4 sm:p-6"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Pilih Level</h1>
          <p className="mt-1 text-xs text-white/40">
            {content.mode === 'free'
              ? 'Pilih langkah mana saja untuk memulai'
              : 'Selesaikan setiap langkah secara berurutan'}
          </p>
        </div>

        <LevelProgressBar pct={pct} />

        <div className="grid grid-cols-2 gap-3">
          {content.steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              index={i}
              status={stepStatus(i, bounded, content.mode)}
              onSelect={() => onSelect(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Progress arrow marking the current fill edge — as given by design. No fixed
// width/height so callers can size it (via className) to match the bar it's
// tipping, and it stays flush as one continuous shape rather than a small
// triangle floating over its own separately-rounded corner.
// function ProgressArrow({ className, style }: { className?: string; style?: React.CSSProperties }) {
//   // The path's own points run from y=-3 to y=27 (height 30) — taller than the
//   // "0 0 7 22" viewBox given alongside it, which silently clips the top and
//   // bottom of the triangle to whatever it happens to cross at y=0/y=22. That
//   // clip is what turned a clean point into a pinched, bulging blob. Sizing the
//   // viewBox to the path's actual bounds (0 -3 7 30) renders it unclipped.
//   return (
//     <svg viewBox="0 -3 7 30" fill="none" className={className} style={style} aria-hidden="true">
//       <path d="M7 12L3.82397e-07 27L4.76837e-07 -3L7 12Z" fill="#FCDC07" />
//     </svg>
//   )
// }

const GOLD_GRADIENT = 'linear-gradient(120deg, #FDDB00 14.62%, #FDA400 68.41%)'
const CARD_GRADIENT = 'linear-gradient(252deg, #565656 -38.22%, #000 41.21%)'

// Tag and trophy are positioned directly on top of the track's own two ends
// (not laid out as separate flex siblings with a gap) so the whole thing
// reads as one continuous connected bar, matching the design, instead of
// three visually separate pieces.
function LevelProgressBar({ pct }: { pct: number }) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ borderColor: '#353535', background: CARD_GRADIENT, backdropFilter: 'blur(21px)' }}
    >
      <div className="relative h-8">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            border: '0.5px solid rgba(177, 177, 177, 0.32)',
            background: 'linear-gradient(180deg, #353535 0%, #414141 100%)',
            boxShadow: '0 1px 7px 0 rgba(0, 0, 0, 0.08)',
          }}
        />
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-end gap-1 pr-3 transition-all"
          style={{
            width: `${Math.max(pct, 12)}%`,
            // Rounded left, FLAT right — the arrow butts flush against this
            // edge and forms the point itself, instead of a separately rounded
            // corner fighting a small triangle overlaid on top of it.
            borderRadius: '9999px',
            background: '#FCDC07',
          }}
        >
          {/* No background of its own — rides on top of the fill, moving with
          it, instead of a separate pinned pill. */}
          <span className="text-[10px] font-bold whitespace-nowrap text-black">{pct}%</span>
        </div>
        {/* <ProgressArrow
          className="absolute top-0 h-8 w-auto -translate-x-px transition-all"
          style={{ left: `${Math.max(pct, 12)}%` }}
        /> */}

        <span
          className="absolute top-1/2 right-0 flex size-8 translate-x-1/4 -translate-y-1/2 items-center justify-center rounded-full"
          style={{ background: GOLD_GRADIENT }}
        >
          <img src={assets.images.icons.trophy} alt="" className="size-5" />
        </span>
      </div>
    </div>
  )
}

// Card border/background/glow per the design's three states. "locked" here is
// a muted variant of the same family, not the (identical) spec given for
// "open" — a disabled card glowing gold like the active one would contradict
// its own locked state, so its border is dimmed and it drops the glow.
function cardStateStyle(status: StepStatus): React.CSSProperties {
  if (status === 'done') {
    return {
      border: '0.5px solid #FDDB00',
      background: CARD_GRADIENT,
      boxShadow: '0 0 12px 0 rgba(253, 164, 0, 0.20)',
    }
  }
  if (status === 'available') {
    return {
      border: '0.5px solid #FFF',
      background: CARD_GRADIENT,
      boxShadow: '0 0 12px 0 rgba(253, 164, 0, 0.20)',
    }
  }
  return { border: '0.5px solid rgba(255, 255, 255, 0.15)', background: CARD_GRADIENT }
}

function StepCard({
  step,
  index,
  status,
  onSelect,
}: {
  step: MicrolearningContent['steps'][number]
  index: number
  status: StepStatus
  onSelect: () => void
}) {
  // Card label: authored `step.title` first, else scrape heading from the
  // first text block, else the first image block's title, else "Langkah N".
  // Card thumbnail: explicit `step.thumbnailUrl` first, else the first image
  // block's url — decorative artwork, independent of a hero image inside the
  // step, so a text/question-only step still gets a card that isn't a flat
  // black square.
  const firstImageBlock = step.blocks.find(
    (b): b is Extract<Block, { kind: 'image' }> => b.kind === 'image'
  )
  const firstTextBlock = step.blocks.find(
    (b): b is Extract<Block, { kind: 'text' }> => b.kind === 'text'
  )
  const label =
    step.title ??
    (firstTextBlock ? parseTextBlock(firstTextBlock.markdown).heading : undefined) ??
    firstImageBlock?.title ??
    `Langkah ${index + 1}`
  const locked = status === 'locked'
  const thumbnail =
    step.thumbnailUrl ?? firstImageBlock?.url ?? assets.images.presentation.classroomExample

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onSelect}
      className="relative aspect-square overflow-hidden rounded-lg text-left disabled:cursor-not-allowed"
      style={cardStateStyle(status)}
    >
      <img
        src={thumbnail}
        alt=""
        className={`absolute inset-0 size-full object-cover ${locked ? 'grayscale' : ''}`}
      />
      <div
        className={`absolute inset-0 ${
          locked ? 'bg-black/70' : 'bg-gradient-to-t from-black/85 via-black/20 to-transparent'
        }`}
      />

      {status === 'done' && (
        <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-[#22C55E] text-white">
          <Icon icon="mdi:check" className="size-4" />
        </span>
      )}
      {locked && (
        <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white/60">
          <Icon icon="mdi:lock" className="size-3.5" />
        </span>
      )}

      <div className="absolute bottom-0 left-0 flex flex-col p-3">
        <span className={`text-2xl font-black ${locked ? 'text-white/30' : 'text-[#FFB800]'}`}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className={`text-xs font-semibold ${locked ? 'text-white/30' : 'text-white'}`}>
          {label}
        </span>
      </div>
    </button>
  )
}
