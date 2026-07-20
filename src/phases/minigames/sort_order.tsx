import { useEffect, useState } from 'react'

import { assets } from '@/assets'
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
import { Icon } from '@iconify/react'
import { onValue, ref, serverTimestamp, set } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

import { ActionButton } from '../Microlearning/PlayerPane/shared'
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
// cards (StepShell) so this template doesn't look like a different app.
function SortOrderShell({
  children,
  footer,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && <div className="p-4 pt-0 sm:p-6 sm:pt-0">{footer}</div>}
      </div>
    </div>
  )
}

function SortOrderPlayerActive({
  title,
  config,
  phaseId,
  sessionId,
  writerId,
}: {
  title: string
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
      <SortOrderShell>
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
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

function SortOrderMonitor({ config }: { config: SortOrderConfig }) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-cover bg-top p-6"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <p className="text-sm text-white/70">Menunggu ketua tim mengirimkan jawaban…</p>
      <p className="text-xs text-white/40">{config.items.length} langkah untuk diurutkan.</p>
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
      title={phase.title}
      config={config}
      phaseId={phase.id}
      sessionId={sessionId}
      writerId={playerId}
    />
  )
}
