import { useEffect, useRef, useState } from 'react'

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
import { onValue, ref, remove, serverTimestamp, set } from 'firebase/database'

import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'
import { TimerRing } from '@/phases/Quiz/TimerRing'

import { rtdb } from '@/lib/firebase'
import { type TimerState, useTimer } from '@/lib/sync/useTimer'

import { isRevealReady, useSortOrderAnswers, useSortOrderRoster } from '../lib'
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

function SortableRow({
  id,
  label,
  position,
  disabled,
}: {
  id: string
  label: string
  position: number
  disabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    borderRadius: 8,
    borderColor: '#99A3AE',
    background: '#1F1F1F',
  }
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 border px-5 py-4 text-sm text-white select-none ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FDDB00] text-xs font-bold text-black">
        {position}
      </span>
      <span className="flex-1">{label}</span>
      <Icon icon="mdi:menu" className="size-5 shrink-0 text-[#FDDB00]" />
    </li>
  )
}

// Reveal row — same numbered-badge layout as SortableRow, but locked in place
// and tinted green/red once `isRevealReady` flips (timer expired), matching
// the Figma correct/incorrect legend colors.
function ResultRow({
  label,
  position,
  correct,
}: {
  label: string
  position: number
  correct: boolean
}) {
  const color = correct ? '#51CE92' : '#F00'
  const tint = correct ? 'rgba(81, 206, 146, 0.16)' : 'rgba(255, 0, 0, 0.16)'
  return (
    <li
      className="flex items-center gap-3 border-2 px-5 py-4 text-sm text-white"
      style={{
        borderRadius: 8,
        borderColor: color,
        background: `linear-gradient(0deg, ${tint} 0%, ${tint} 100%), #1F1F1F`,
      }}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FDDB00] text-xs font-bold text-black">
        {position}
      </span>
      <span className="flex-1">{label}</span>
      <Icon
        icon={correct ? 'mdi:check-circle' : 'mdi:close-circle'}
        className="size-5 shrink-0"
        style={{ color }}
      />
    </li>
  )
}

// Full-bleed background + rounded card frame, matching the microlearning step
// cards (StepShell) so this template doesn't look like a different app. Owns
// its own timer ring (when the phase has one) instead of relying on the page
// shell's generic TimerBar — that row would stack above this min-h-dvh card
// and push the page taller than one viewport, forcing a scroll. Reuses Quiz's
// TimerRing so every phase counts down with the same depleting-ring look.
function SortOrderShell({
  children,
  footer,
  timer,
  totalSec,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  timer: TimerState
  totalSec: number
}) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-cover bg-top p-4 sm:p-6"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ borderColor: '#353535' }}
      >
        {timer.active && (
          <div className="flex justify-center pt-4">
            <TimerRing
              remainingSec={timer.remainingSec}
              totalSec={totalSec}
              expired={timer.expired}
              size={88}
            />
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
  const totalSec = phase.timer?.seconds ?? 60
  const roster = useSortOrderRoster(sessionId, phase)
  const answers = useSortOrderAnswers(sessionId, roster, phaseId)
  const ready = isRevealReady(roster, answers, timer.expired)
  const [order, setOrder] = useState<string[]>(() => shuffled(config.items.map((i) => i.id)))
  const [busy, setBusy] = useState(false)
  const [submittedIds, setSubmittedIds] = useState<string[] | null>(null)
  const autoSubmittedRef = useRef(false)
  const hadSubmittedRef = useRef(false)

  // Rejoin: if writerId already submitted for this phase, restore the locked
  // view. Narrow read — only the writer's answer node, not players/*. Also
  // handles the reverse: a host "Reset Level" removes this same node, so a
  // previously-submitted answer can disappear underneath us. When it does,
  // reshuffle and drop back into the draggable view instead of staying stuck
  // showing the old (now-deleted) result.
  useEffect(() => {
    return onValue(
      ref(rtdb, `sessions/${sessionId}/players/${writerId}/answers/${phaseId}`),
      (s) => {
        const v = s.val()
        if (v && Array.isArray(v.value)) {
          hadSubmittedRef.current = true
          setSubmittedIds(v.value as string[])
        } else if (hadSubmittedRef.current) {
          hadSubmittedRef.current = false
          autoSubmittedRef.current = false
          setOrder(shuffled(config.items.map((i) => i.id)))
          setSubmittedIds(null)
        }
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, writerId, phaseId])

  // Detect the host re-opening this same phase ("Reset Level" → resetPhase →
  // a fresh timer.endsAt for the same phaseId) and, in response, clear OUR
  // OWN stored answer. A host can't delete it directly — database.rules.json
  // scopes every write under players/{writerId} to that id's registered
  // owner (see session/presence.ts#claimOwnership), and the host's auth.uid
  // is never that owner — so the reset has to be self-triggered like this.
  // `undefined` (vs `null`) distinguishes "no snapshot seen yet" from "phase
  // genuinely has no timer", so the very first snapshot never fires a delete.
  const lastEndsAtRef = useRef<number | null | undefined>(undefined)
  useEffect(() => {
    return onValue(ref(rtdb, `sessions/${sessionId}/timer`), (s) => {
      const v = s.val() as { phaseId?: string; endsAt?: number } | null
      if (!v || v.phaseId !== phaseId) return
      const prevEndsAt = lastEndsAtRef.current
      lastEndsAtRef.current = v.endsAt ?? null
      if (prevEndsAt !== undefined && v.endsAt !== prevEndsAt && hadSubmittedRef.current) {
        remove(ref(rtdb, `sessions/${sessionId}/players/${writerId}/answers/${phaseId}`))
      }
    })
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

  // Lock in whatever order the player has dragged to so far the moment the
  // clock hits zero — without this, someone who never hits "Selanjutnya"
  // stays stuck on the draggable view forever, since reveal only renders
  // once `submittedIds` is set. The ref (not state) guards against firing
  // more than once — `submittedIds` only updates once the write round-trips
  // back through the listener, so a state-only guard could re-fire on every
  // render in between and send duplicate writes.
  useEffect(() => {
    if (timer.expired && !submittedIds && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      submit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.expired, submittedIds])

  const idToLabel = Object.fromEntries(config.items.map((i) => [i.id, i.label]))

  // Before reveal is ready, don't show the dragged order at all (correct/wrong
  // tinting would leak early) — just confirm the submission and wait, same
  // "submitted" pattern as Quiz's AnsweringStage. No timer ring here per the
  // Figma waiting screen — it's the one moment this template deliberately
  // doesn't show the countdown.
  if (submittedIds && !ready) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cover bg-top p-6 text-center"
        style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
      >
        <div className="flex gap-2">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-3 animate-bounce rounded-full bg-[#FDDB00]"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        <p className="text-xl font-bold text-[#FFB800]">Jawaban tersimpan!</p>
        <p className="text-sm text-white/50">Menunggu pemain lain menjawab...</p>
      </div>
    )
  }

  if (submittedIds) {
    return (
      <SortOrderShell timer={timer} totalSec={totalSec}>
        <div className="flex flex-col items-center gap-1 pb-5 text-center">
          <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
          <h1 className="text-xl font-bold text-[#FFB800]">{title}</h1>
          <p className="text-sm text-white/50">Urutan yang benar</p>
        </div>
        <ol className="flex flex-col gap-2.5">
          {submittedIds.map((id, i) => (
            <ResultRow
              key={id}
              label={idToLabel[id] ?? id}
              position={i + 1}
              correct={config.correctOrder[i] === id}
            />
          ))}
        </ol>
      </SortOrderShell>
    )
  }

  return (
    <SortOrderShell
      timer={timer}
      totalSec={totalSec}
      footer={
        <ActionButton disabled={busy || timer.expired} onClick={submit}>
          {busy || timer.expired ? 'Mengirim…' : 'Selanjutnya'}
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
              <SortableRow
                key={id}
                id={id}
                label={idToLabel[id] ?? id}
                position={i + 1}
                disabled={timer.expired}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </SortOrderShell>
  )
}
