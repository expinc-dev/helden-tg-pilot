import { useEffect, useState } from 'react'

import { assets } from '@/assets'
import {
  DndContext,
  type DragEndEvent,
  type Modifier,
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
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'
import { onValue, ref, serverTimestamp, set } from 'firebase/database'

import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'

import { rtdb } from '@/lib/firebase'
import { mmss } from '@/lib/sync/timermath'
import { useTimer } from '@/lib/sync/useTimer'

import type { SortOrderConfig } from '../score'

// This is a vertical-only reorder list — without this, dnd-kit's default drag
// transform follows the pointer on both axes, letting a row slide sideways
// and push the page into horizontal overflow/scroll.
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })

// Fisher-Yates — the AC calls for shuffled cards, not the authored item order
// (which would just start already-solved).
function shuffled(ids: string[]): string[] {
  const arr = [...ids]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

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

// Full-bleed background + rounded card frame, matching the microlearning step
// cards (StepShell) so this template doesn't look like a different app. Owns
// its own timer pill (when the phase has one) instead of relying on the page
// shell's generic TimerBar — that row would stack above this min-h-dvh card
// and push the page taller than one viewport, forcing a scroll.
function SortOrderShell({
  children,
  footer,
  timerLabel,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  timerLabel?: string
}) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-cover bg-top p-4 sm:p-6"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        {timerLabel && (
          <div className="flex justify-center pt-4">
            <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-lg text-[#FFB800] tabular-nums">
              {timerLabel}
            </span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && <div className="p-4 pt-0 sm:p-6 sm:pt-0">{footer}</div>}
      </div>
    </div>
  )
}

export function SortOrderPlayerActive({
  phase,
  config,
  sessionId,
  writerId,
}: {
  phase: Phase
  config: SortOrderConfig
  sessionId: string
  writerId: string // playerId that owns the write path (solo=self, leader=leader)
}) {
  const title = phase.title
  const phaseId = phase.id
  const timer = useTimer(sessionId, phase)
  const timerLabel = timer.active
    ? timer.expired
      ? 'Waktu habis'
      : mmss(timer.remainingSec)
    : undefined
  const [order, setOrder] = useState<string[]>(() => shuffled(config.items.map((i) => i.id)))
  const [busy, setBusy] = useState(false)
  const [submittedIds, setSubmittedIds] = useState<string[] | null>(null)

  // Rejoin: if writerId already submitted for this phase, restore the locked
  // view. Narrow read — only the writer's answer node, not players/*.
  useEffect(() => {
    return onValue(
      ref(rtdb, `sessions/${sessionId}/players/${writerId}/answers/${phaseId}`),
      (s) => {
        const v = s.val()
        if (v && Array.isArray(v.value)) setSubmittedIds(v.value as string[])
      }
    )
  }, [sessionId, writerId, phaseId])

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setOrder((prev) => {
      const from = prev.indexOf(active.id as string)
      const to = prev.indexOf(over.id as string)
      return from < 0 || to < 0 ? prev : arrayMove(prev, from, to)
    })
  }

  const submit = async () => {
    setBusy(true)
    await set(ref(rtdb, `sessions/${sessionId}/players/${writerId}/answers/${phaseId}`), {
      value: order,
      submittedAt: serverTimestamp(),
    })
    setBusy(false)
  }

  const idToLabel = Object.fromEntries(config.items.map((i) => [i.id, i.label]))

  if (submittedIds) {
    return (
      <SortOrderShell timerLabel={timerLabel}>
        <div className="flex flex-col items-center gap-1 pb-5 text-center">
          <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
          <h1 className="text-xl font-bold text-[#FFB800]">{title}</h1>
          <p className="text-sm text-white/50">Terkirim — menunggu waktu berakhir…</p>
        </div>
        <ol className="flex flex-col gap-2.5">
          {submittedIds.map((id, i) => (
            <li
              key={id}
              className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-white"
              style={{ borderColor: '#99A3AE', background: '#1F1F1F' }}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FDDB00] text-xs font-bold text-black">
                {i + 1}
              </span>
              <span className="flex-1">{idToLabel[id] ?? id}</span>
            </li>
          ))}
        </ol>
      </SortOrderShell>
    )
  }

  return (
    <SortOrderShell
      timerLabel={timerLabel}
      footer={
        <ActionButton disabled={busy} onClick={submit}>
          {busy ? 'Mengirim…' : 'Selanjutnya'}
        </ActionButton>
      }
    >
      <div className="flex flex-col items-center gap-1 pb-5 text-center">
        <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
        <h1 className="text-xl font-bold text-[#FFB800]">{title}</h1>
        <p className="text-sm text-white/50">
          Seret setiap langkah ke urutan yang benar, lalu lanjutkan.
        </p>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2.5">
            {order.map((id, i) => (
              <SortableRow key={id} id={id} label={idToLabel[id] ?? id} position={i + 1} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </SortOrderShell>
  )
}
