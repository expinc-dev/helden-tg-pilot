import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Block } from '@helden-inc/tg-schema'

// Another microlearning-only extension to tg-schema's Question union (see
// OrderQuestion.tsx for the same pattern/rationale) — drag each pool image
// into a numbered slot to build an ordered sequence. Unlike 'order' (which
// reorders a pre-placed list), slots start empty: the draft is a same-length
// array of image ids or null, indexed by slot position.
export type ImageSequenceQuestion = {
  qType: 'image_sequence'
  prompt: Block[]
  images: { id: string; mediaId: string }[]
}

function PoolThumb({ id, mediaId }: { id: string; mediaId: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
        borderColor: '#99A3AE',
      }}
      className="relative size-16 shrink-0 cursor-grab touch-none overflow-hidden rounded-lg border active:cursor-grabbing"
    >
      <img src={mediaId} alt="" className="size-full object-cover" />
    </button>
  )
}

function Slot({
  index,
  mediaId,
  interactive,
}: {
  index: number
  mediaId: string | null
  interactive: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}`, disabled: !interactive })
  return (
    <div
      ref={setNodeRef}
      className="relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-xl border"
      style={{ borderColor: isOver ? '#FDDB00' : '#99A3AE', background: '#1F1F1F' }}
    >
      <span className="absolute top-2 left-2 z-10 rounded bg-[#FDDB00] px-1.5 py-0.5 text-[10px] font-bold text-black">
        Gambar {index + 1}
      </span>
      {mediaId ? (
        <img src={mediaId} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center px-8 text-center text-xs text-white/30">
          Seret gambar kedalam kotak untuk membuat rangkaian cerita
        </div>
      )}
    </div>
  )
}

// Ungraded, same as every other microlearning question — gate is satisfied
// once every slot has an image (isDraftValid.ts), there's no "correct"
// sequence enforced here.
export function ImageSequenceView({
  question,
  draft,
  onDraftChange,
  disabled,
}: {
  question: ImageSequenceQuestion
  draft: unknown
  onDraftChange: (value: unknown) => void
  disabled: boolean
}) {
  const placements: (string | null)[] =
    Array.isArray(draft) && draft.length === question.images.length
      ? (draft as (string | null)[])
      : question.images.map(() => null)
  const idToMedia = Object.fromEntries(question.images.map((i) => [i.id, i.mediaId]))
  const placedIds = new Set(placements.filter((v): v is string => v !== null))
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over) return
    const slotMatch = /^slot-(\d+)$/.exec(String(over.id))
    if (!slotMatch) return
    const targetIndex = Number(slotMatch[1])
    const imageId = String(active.id)
    const next = placements.map((v) => (v === imageId ? null : v))
    next[targetIndex] = imageId
    onDraftChange(next)
  }

  // Same horizontal strip shape in both states — only the pool row and drag
  // capability disappear once locked, so a reviewed step doesn't suddenly
  // reflow into a tall vertical stack.
  const slotStrip = (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
      {placements.map((imageId, i) => (
        <Slot
          key={i}
          index={i}
          mediaId={imageId ? idToMedia[imageId] : null}
          interactive={!disabled}
        />
      ))}
    </div>
  )

  if (disabled) {
    return <div className="flex flex-col gap-4">{slotStrip}</div>
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-4">
        {slotStrip}
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {question.images.map((img) =>
            placedIds.has(img.id) ? (
              <div
                key={img.id}
                className="size-16 shrink-0 rounded-lg border"
                style={{ borderColor: '#353535', background: '#141414' }}
              />
            ) : (
              <PoolThumb key={img.id} id={img.id} mediaId={img.mediaId} />
            )
          )}
        </div>
      </div>
    </DndContext>
  )
}
