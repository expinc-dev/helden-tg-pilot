import { useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Phase } from '@helden-inc/tg-schema'

import { setDoubtSeedShared, submitDoubtSeedAnswer } from '@/lib/session/doubtSeed'

import { SubmittedPane } from './SubmittedPane'
import { cardTextIndex, submittedGalleryEntries } from './gallery'
import { type DoubtSeedConfig, keepsVersionPrivate } from './score'
import { useGalleryAnswers, usePlayerGalleryRoster } from './useGallery'

type Card = { id: string; text: string }
type Slot = Card | null

// Doubt-seed interaction (HLN-006): a card pool (soul + distractor shuffled)
// from which the player drags cards into N drop zones. Any arrangement is
// valid — reflection activity, no grading. Full drag-and-drop using
// @dnd-kit/core (reused from sort_order, C5). PointerSensor covers mouse;
// TouchSensor covers touch — without it a phone claims the gesture for scroll
// (pointercancel) and the card never lifts. The parent (index.tsx) drives
// role/team handling.
//
// On submit the screen becomes the gallery (HLN-003, storyboard §7): the room's
// versions scroll anonymously, so a player who finished early has something to
// read instead of a spinner. No name and no score ever reaches this list — the
// labels are positional ("Tim A/B/C"), which is the point of the exercise.
// That whole post-submit screen is SubmittedPane, so it can be rendered and
// checked without a running session.
export function DoubtSeedPlayer({
  phase,
  sessionId,
  writerId,
  config,
}: {
  phase: Phase
  sessionId: string
  writerId: string
  config: DoubtSeedConfig
}) {
  const { soulCards, distractorCards, dropZones, instructions, gallery } = config
  const phaseId = phase.id
  const pool = useMemo(
    () => shufflePool([...soulCards, ...distractorCards]),
    [soulCards, distractorCards]
  )
  const [slots, setSlots] = useState<Slot[]>(() => Array.from({ length: dropZones }, () => null))
  const [active, setActive] = useState<Card | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  // Whether this player's version starts off the wall — the same predicate the
  // answer write uses (lib/session/doubtSeed.ts), so the screen can never claim
  // a state the stored answer disagrees with. Private is the default in
  // `optional` mode because the alternative — shown until the player finds the
  // opt-out — would leak the very thing the storyboard is careful about.
  const privateByDefault = keepsVersionPrivate(gallery)
  const [shared, setShared] = useState(!privateByDefault)

  // The gallery reads are mounted from the first render, not from the submit —
  // hooks cannot be called conditionally. They are cheap (one flat uid map plus
  // one listener per writer), and they describe the very pool this player is
  // about to join. `usePlayerGalleryRoster` deliberately avoids presence, which
  // a player client may not read. A switched-off gallery subscribes to nothing:
  // the phone is on a shared mobile connection, and there is no wall to fill.
  const gallerySessionId = gallery.enabled ? sessionId : undefined
  const roster = usePlayerGalleryRoster(gallerySessionId, phase)
  const answers = useGalleryAnswers(gallerySessionId, roster, phaseId)
  const entries = submittedGalleryEntries(roster, answers, cardTextIndex(config))

  const filledCount = slots.filter((s) => s !== null).length
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  )

  const onDragStart = (e: DragStartEvent) =>
    setActive(pool.find((c) => c.id === e.active.id) ?? null)

  const onDragEnd = (e: DragEndEvent) => {
    const { active: act, over } = e
    setActive(null)
    if (!over) return
    if (String(over.id).startsWith('slot-')) {
      const idx = Number(String(over.id).replace('slot-', ''))
      const card = pool.find((c) => c.id === act.id)
      if (!card || Number.isNaN(idx) || idx < 0 || idx >= dropZones) return
      setSlots((prev) => {
        const already = prev.some((s) => s?.id === card.id)
        if (already || prev[idx]) return prev
        return prev.map((s, i) => (i === idx ? card : s))
      })
    }
  }

  const submit = async () => {
    if (filledCount !== dropZones || busy) return
    setBusy(true)
    await submitDoubtSeedAnswer(
      sessionId,
      writerId,
      phaseId,
      slots.flatMap((s) => (s ? [s.id] : [])),
      gallery
    )
    setSubmitted(true)
    setBusy(false)
  }

  const shareToGallery = async () => {
    if (shareBusy) return
    setShareBusy(true)
    try {
      await setDoubtSeedShared(sessionId, writerId, phaseId, true)
      setShared(true)
    } finally {
      setShareBusy(false)
    }
  }

  if (submitted) {
    return (
      <SubmittedPane
        entries={entries}
        gallery={gallery}
        shared={shared}
        shareBusy={shareBusy}
        onShare={shareToGallery}
      />
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#1F1F1F] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-md flex-1">
        <div className="flex flex-col items-center gap-1 pb-5 text-center">
          <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
        </div>
        {instructions && <p className="pb-4 text-center text-sm text-white/50">{instructions}</p>}

        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="mb-6 flex flex-col gap-2.5">
            {slots.map((slot, i) => (
              <SlotDropzone
                key={i}
                index={i}
                slot={slot}
                onRemove={() => setSlots((prev) => prev.map((s, j) => (j === i ? null : s)))}
              />
            ))}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {pool.map((card) => {
              if (slots.some((s) => s?.id === card.id)) return null
              return <PoolCard key={card.id} card={card} disabled={filledCount >= dropZones} />
            })}
          </div>

          <DragOverlay>
            {active ? (
              <div className="rounded-lg border border-white/20 bg-[#1F1F1F] px-3 py-2 text-sm text-white/80 shadow-xl">
                {active.text || active.id}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <button
          type="button"
          disabled={filledCount !== dropZones || busy}
          onClick={() => setConfirmSubmit(true)}
          className="w-full rounded-lg bg-[#FFB800] py-3.5 text-center text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#2A2A2A] disabled:text-white/30"
        >
          {busy ? 'Mengirim…' : filledCount === dropZones ? 'Selanjutnya' : 'Isi semua slot dulu'}
        </button>
        {confirmSubmit && (
          <ConfirmDialog
            title="Apakah kamu yakin?"
            message="Jawaban yang sudah dikirim tidak bisa diubah lagi."
            confirmLabel="Ya, kirim"
            cancelLabel="Periksa lagi"
            onCancel={() => setConfirmSubmit(false)}
            onConfirm={() => {
              setConfirmSubmit(false)
              void submit()
            }}
          />
        )}
      </div>
    </div>
  )
}

function SlotDropzone({
  index,
  slot,
  onRemove,
}: {
  index: number
  slot: Slot
  onRemove: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` })
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-12 items-center rounded-lg border p-2 text-sm ${
        slot
          ? 'border-[#FFB800] bg-[rgba(253,219,0,0.12)] text-white'
          : isOver
            ? 'border-[#FFB800] bg-[rgba(253,219,0,0.18)]'
            : 'border-dashed border-white/25 bg-white/5 text-white/30'
      }`}
    >
      {slot ? (
        <button
          type="button"
          onClick={onRemove}
          className="flex w-full items-center justify-between font-semibold text-[#FFB800]"
        >
          {slot.text || slot.id}
          <span className="text-xs text-white/40">tap ↺</span>
        </button>
      ) : (
        <span className="w-full text-center">Slot {index + 1}</span>
      )}
    </div>
  )
}

function PoolCard({ card, disabled }: { card: Card; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    disabled,
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      className={`touch-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/80 transition select-none ${
        isDragging ? 'opacity-40' : 'hover:border-[#FFB800]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {card.text || card.id}
    </button>
  )
}

// Fisher-Yates — the pool must be shuffled so the soul cards aren't obviously
// grouped together at authoring time. Shuffle ONCE per config change (useMemo),
// never per render — a per-render shuffle would reorder the pool mid-drag and
// make the cards visibly jump around under the user's pointer.
function shufflePool<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
