import { useEffect } from 'react'

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block, Question } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import type { ImageSequenceQuestion } from './ImageSequenceQuestion'

// tg-schema's Question union has no ranking/reorder variant — this is a
// microlearning-only extension (author it in demoBundle.ts with `as unknown
// as Question` at the object-literal boundary, same pattern as the standalone
// sort_order minigame template but embedded as a step block here instead of
// its own phase).
export type OrderQuestion = {
  qType: 'order'
  prompt: Block[]
  items: { id: string; label: string }[]
}

export type MicroQuestion = Question | OrderQuestion | ImageSequenceQuestion

function SortableRow({ id, label, position }: { id: string; label: string; position: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  return (
    <li
      ref={setNodeRef}
      style={{ ...style, borderColor: '#99A3AE', background: '#1F1F1F' }}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-3 rounded-lg border px-4 py-3 text-sm text-white select-none active:cursor-grabbing"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FDDB00] text-xs font-bold text-black">
        {position}
      </span>
      <span className="flex-1">{label}</span>
      <Icon icon="mdi:drag-horizontal-variant" className="size-5 shrink-0 text-white/40" />
    </li>
  )
}

// Ungraded, same as every other microlearning question type — there's no
// "correct" order enforced here, so the draft is always valid the moment it
// exists (isDraftValid.ts), and it's seeded with the authored item order on
// first mount rather than starting empty like a pick/typed answer would.
export function OrderQuestionView({
  question,
  draft,
  onDraftChange,
  disabled,
}: {
  question: OrderQuestion
  draft: unknown
  onDraftChange: (value: unknown) => void
  disabled: boolean
}) {
  const order = Array.isArray(draft) ? (draft as string[]) : question.items.map((i) => i.id)

  useEffect(() => {
    if (!Array.isArray(draft)) onDraftChange(order)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))
  const onDragEnd = (e: DragEndEvent) => {
    if (disabled) return
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = order.indexOf(active.id as string)
    const to = order.indexOf(over.id as string)
    if (from < 0 || to < 0) return
    onDraftChange(arrayMove(order, from, to))
  }

  const idToLabel = Object.fromEntries(question.items.map((i) => [i.id, i.label]))

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-2.5">
          {order.map((id, i) => (
            <SortableRow key={id} id={id} label={idToLabel[id] ?? id} position={i + 1} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}
