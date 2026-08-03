import { assets } from '@/assets'
import type { FlowMode, Phase, PublishedGame } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { useGameType } from '@/lib/sync/useGameType'

import { Header } from './Header'
import { HostBadge } from './HostBadge'

// Level card status for the picker. Drives which action button renders:
//   available → yellow "Mulai Permainan" (tappable)
//   played    → yellow-outline "Sudah Dimainkan" (disabled)
//   locked    → dark "Locked" (disabled; used only in modular-progressive)
type CardStatus = 'available' | 'played' | 'locked'

interface Card {
  phase: Phase
  level: number
  status: CardStatus
}

// Modular level picker. Renders one card per non-idle phase in phaseOrder.
// Idle is the picker's anchor state, so it never appears as a card. Card
// status is derived from flowMode + played set:
//   modular-open: available unless played.
//   modular-progressive: only the FIRST unplayed non-idle card is available;
//                        earlier cards are played, later ones are locked.
export function PickerGrid({
  bundle,
  played,
  onPick,
  onEndSession,
}: {
  bundle: PublishedGame
  played: Record<string, true>
  onPick: (phaseId: string) => void
  onEndSession: () => void
}) {
  const cards = buildCards(bundle, played, bundle.flowMode ?? 'sequential')
  const gameType = useGameType()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-5 py-3">
      <Header />

      <div className="mt-3 flex flex-1 flex-col gap-6 overflow-y-auto rounded-2xl border border-white/5 bg-[#12121299] px-8 py-3">
        <HostBadge pageName={gameType} />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Pilih Level</h1>
          <p className="mx-auto mt-2 max-w-xl text-xl font-extralight text-white/70">
            Mulai permainan dengan memilih salah satu level di bawah ini.
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-4">
          {cards.map((card) => (
            <LevelCard key={card.phase.id} card={card} onPick={() => onPick(card.phase.id)} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onEndSession}
        className="mb-5 w-full rounded-lg border border-white/10 py-3 text-sm font-semibold text-white/70 hover:text-white"
      >
        Akhiri Sesi
      </button>
    </div>
  )
}

// ─── Card builder ───────────────────────────────────────────────────────────
function buildCards(
  bundle: PublishedGame,
  played: Record<string, true>,
  flowMode: FlowMode
): Card[] {
  const nonIdle = bundle.phaseOrder
    .map((id) => bundle.phases[id])
    .filter((p): p is Phase => !!p && p.type !== 'idle')

  if (flowMode === 'modular-progressive') {
    // First unplayed non-idle phase is the "next" — the only tappable card.
    // Everything before it is played; everything after is locked.
    const nextIdx = nonIdle.findIndex((p) => !played[p.id])
    return nonIdle.map((phase, idx) => ({
      phase,
      level: idx + 1,
      status: played[phase.id] ? 'played' : idx === nextIdx ? 'available' : 'locked',
    }))
  }

  // modular-open (and any other value fell back to open behaviour).
  return nonIdle.map((phase, idx) => ({
    phase,
    level: idx + 1,
    status: played[phase.id] ? 'played' : 'available',
  }))
}

// ─── Level card ─────────────────────────────────────────────────────────────
function LevelCard({ card, onPick }: { card: Card; onPick: () => void }) {
  const { phase, level, status } = card
  // ponytail: static placeholder art. Wire to phase.thumbnailMediaId when the
  // CMS media resolver ships — schema field already exists (tg-schema 3.0).
  const thumbnail = assets.images.backgrounds.auth
  return (
    <div className="grid grid-cols-4 gap-4 rounded-2xl border border-white/5 bg-[#121212] p-4 sm:flex-row sm:gap-5 sm:p-5">
      <div
        className="col-span-2 aspect-[16/8] w-full flex-shrink-0 overflow-hidden rounded-xl bg-cover bg-center"
        style={{ backgroundImage: `url(${thumbnail})` }}
      />
      <div className="col-span-2 flex flex-1 flex-col justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-white/80">Level {level}</span>
          <h3 className="text-helden-yellow text-lg font-bold sm:text-xl">{phase.title}</h3>
        </div>
        {phase.durationMin !== undefined && (
          <div className="flex flex-wrap gap-2">
            <DurationChip minutes={phase.durationMin} />
          </div>
        )}
        <ActionButton status={status} onPick={onPick} />
      </div>
    </div>
  )
}

function DurationChip({ minutes }: { minutes: number }) {
  return (
    <span className="flex items-center gap-1.5 rounded-lg bg-[#1C1C1E] px-3 py-1.5 text-xs text-white/80">
      <Icon icon="mdi:clock-outline" className="size-4 text-white/60" />
      {minutes} min
    </span>
  )
}

function ActionButton({ status, onPick }: { status: CardStatus; onPick: () => void }) {
  if (status === 'available') {
    return (
      <button
        type="button"
        onClick={onPick}
        className="bg-helden-yellow-gradient flex h-12 w-full items-center justify-center rounded-lg py-3.5 text-base font-medium text-black"
      >
        Mulai Permainan
      </button>
    )
  }
  if (status === 'played') {
    return (
      <button
        type="button"
        disabled
        className="text-helden-yellow/60 border-helden-yellow/40 flex h-12 w-full items-center justify-center gap-2 rounded-lg border py-3.5 text-base"
      >
        <Icon icon="mdi:check-circle" className="size-4" />
        Sudah Dimainkan
      </button>
    )
  }
  // locked
  return (
    <button
      type="button"
      disabled
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1C1C1E] py-3.5 text-base font-medium text-white/40"
    >
      <Icon icon="mdi:lock" className="size-4" />
      Locked
    </button>
  )
}
