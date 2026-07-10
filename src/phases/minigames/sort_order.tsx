import { useEffect, useState } from 'react'

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
import { onValue, ref, serverTimestamp, set } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

import { TeamFocusLeader } from '../TeamFocusLeader'
import type { SortOrderConfig } from './sort_order.score'
import type { MinigameRendererProps } from './types'

// sort_order template (BLUEPRINT_runtime §9 v1). Player arranges labelled items
// into the correctOrder set by the author. Scored on exact-match correctness +
// speed (via ScoringConfig.speedBonus at the phase level, applied by
// scorePhase — this template only returns the correctness signal).
//
// Team mode: only the team leader plays; members see a "focus on the leader"
// screen. Submissions are locked once written (server-side would need rules to
// enforce; UI enforces client-side).

function SortableRow({ id, label }: { id: string; label: string }) {
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
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-3 rounded border bg-white px-3 py-3 text-sm shadow-sm select-none active:cursor-grabbing"
    >
      <span aria-hidden className="text-gray-400">
        ⋮⋮
      </span>
      <span>{label}</span>
    </li>
  )
}

function SortOrderPlayerActive({
  config,
  phaseId,
  sessionId,
  writerId,
}: {
  config: SortOrderConfig
  phaseId: string
  sessionId: string
  writerId: string // playerId that owns the write path (solo=self, leader=leader)
}) {
  const [order, setOrder] = useState<string[]>(config.items.map((i) => i.id))
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
      <div className="flex flex-col gap-3 p-6">
        <p className="text-sm font-medium text-green-600">Submitted ✓</p>
        <ol className="flex flex-col gap-2">
          {submittedIds.map((id, i) => (
            <li
              key={id}
              className="flex items-center gap-3 rounded border bg-gray-50 px-3 py-3 text-sm"
            >
              <span className="w-5 text-right text-gray-400">{i + 1}.</span>
              <span>{idToLabel[id] ?? id}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-gray-400">Waiting for the timer to end…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-6">
      <p className="text-sm text-gray-500">Drag the items into the correct order, then submit.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2">
            {order.map((id) => (
              <SortableRow key={id} id={id} label={idToLabel[id] ?? id} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <button
        onClick={submit}
        disabled={busy}
        className="mt-2 self-start rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  )
}

function SortOrderMonitor({ config }: { config: SortOrderConfig }) {
  return (
    <div className="flex flex-col gap-2 p-6">
      <p className="text-sm text-gray-500">Waiting for team leaders to submit…</p>
      <p className="text-xs text-gray-400">{config.items.length} items to order.</p>
    </div>
  )
}

export function SortOrderRenderer(props: MinigameRendererProps<SortOrderConfig>) {
  const { config, phase, sessionId, playerId, role, teamRole } = props
  if (role !== 'player') return <SortOrderMonitor config={config} />
  // Router already gates team_leader_only + member (via TeamFocusLeader before
  // reaching here). Sort_order additionally treats team_collaborative + member
  // the same way — only the leader plays in EITHER team mode.
  if (teamRole === 'member') return <TeamFocusLeader phaseId={phase.id} />
  if (!playerId) return <SortOrderMonitor config={config} />
  return (
    <SortOrderPlayerActive
      config={config}
      phaseId={phase.id}
      sessionId={sessionId}
      writerId={playerId}
    />
  )
}
