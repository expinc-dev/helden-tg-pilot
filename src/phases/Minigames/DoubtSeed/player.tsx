import { useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'
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
import { Icon } from '@iconify/react'

import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'

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
    <>
      <PlayerScreenFrame
        panelClassName="gap-6 p-4"
        footer={
          <ActionButton
            disabled={filledCount !== dropZones || busy}
            onClick={() => setConfirmSubmit(true)}
          >
            {busy ? 'Mengirim…' : filledCount === dropZones ? 'Selanjutnya' : 'Isi semua slot dulu'}
          </ActionButton>
        }
      >
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {/* Figma "Penyusunan Kartu": title + hint, dashed card slots, then a
              second bordered "Daftar Kartu" panel with the draggable pool. */}
          <div className="flex flex-col gap-4 rounded-lg border border-[#353535] p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-xl leading-[1.2] font-semibold tracking-[-0.04em] text-white">
                Penyusunan Kartu
              </h2>
              {instructions && (
                <p className="text-sm leading-[1.3] tracking-[-0.04em] text-[#ccc]">
                  {instructions}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {slots.map((slot, i) => (
                <SlotDropzone
                  key={i}
                  index={i}
                  slot={slot}
                  onRemove={() => setSlots((prev) => prev.map((s, j) => (j === i ? null : s)))}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-[#353535] p-4">
            <p className="text-base tracking-[-0.04em] text-white">Daftar Kartu</p>
            <div className="grid grid-cols-4 gap-2">
              {pool.map((card) => {
                if (slots.some((s) => s?.id === card.id)) return null
                return <PoolCard key={card.id} card={card} disabled={filledCount >= dropZones} />
              })}
            </div>
          </div>

          <DragOverlay>
            {active ? (
              <div className="rounded-lg border border-white/20 bg-[#1F1F1F] px-3 py-2 text-sm text-white/80 shadow-xl">
                {active.text || active.id}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </PlayerScreenFrame>
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
    </>
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
      className={`flex aspect-[3/4] items-center justify-center rounded-lg border p-1 text-center text-xs ${
        slot
          ? 'border-[#FDDB00] bg-[rgba(253,219,0,0.08)] text-white'
          : isOver
            ? 'border-solid border-[#FDDB00] bg-[rgba(253,219,0,0.12)]'
            : 'border-dashed border-[#6b6b6b] bg-black/20 text-white/40'
      }`}
    >
      {slot ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Lepas kartu"
          className="size-full font-semibold text-[#FDDB00]"
        >
          {slot.text || slot.id}
        </button>
      ) : (
        <Icon icon="mdi:plus" className="size-5" />
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
      className={`flex aspect-[3/4] touch-none items-center justify-center rounded-lg border border-[#353535] bg-[#141414] p-1 text-center text-xs leading-tight text-white transition select-none ${
        isDragging ? 'opacity-40' : 'hover:border-[#FDDB00]'
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
