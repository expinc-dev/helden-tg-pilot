import { assets } from '@/assets'
import type { Phase, PublishedGame } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { useGameType } from '@/lib/sync/useGameType'

import { Header } from './Header'
import { HostBadge } from './HostBadge'

// Human label + icon per phase content type, shown as a chip on each card.
const TYPE_META: Record<string, { label: string; icon: string }> = {
  video: { label: 'Video', icon: 'mdi:play-circle-outline' },
  quiz: { label: 'Quiz', icon: 'mdi:help-circle-outline' },
  presentation: { label: 'Presentasi', icon: 'mdi:presentation' },
  microlearning: { label: 'Microlearning', icon: 'mdi:book-open-variant' },
  minigame: { label: 'Minigame', icon: 'mdi:gamepad-variant-outline' },
  reflection: { label: 'Refleksi', icon: 'mdi:thought-bubble-outline' },
  content: { label: 'Konten', icon: 'mdi:text-box-outline' },
  codeinput: { label: 'Kode', icon: 'mdi:form-textbox' },
  codepiece: { label: 'Potongan Kode', icon: 'mdi:puzzle-outline' },
  idle: { label: 'Jeda', icon: 'mdi:timer-sand' },
  end: { label: 'Penutup', icon: 'mdi:flag-checkered' },
}
const DEFAULT_META = { label: 'Phase', icon: 'mdi:shape-outline' }

// Host's opening screen, shown before phase 1 starts: one card per phase in
// phaseOrder (phases are told apart by id, not grouped into levels). Only the
// first card is startable — the run itself stays sequential — the rest are a
// locked preview of what's coming.
export function PhaseStartList({
  bundle,
  onStart,
  onBack,
}: {
  bundle: PublishedGame
  onStart: () => void
  onBack: () => void
}) {
  const gameType = useGameType()
  const phases = bundle.phaseOrder.map((id) => bundle.phases[id]).filter((p): p is Phase => !!p)

  return (
    <div
      className="flex h-dvh w-full flex-col gap-3 overflow-hidden px-[6%] py-3"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Header />

      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto rounded-2xl border border-white/10 bg-[#12121299] px-8 py-4">
        <div className="flex flex-col items-center gap-6">
          <HostBadge pageName={gameType} />
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white">Pilih Phase</h1>
            <p className="mx-auto mt-2 max-w-xl text-xl font-extralight text-white/70">
              Pilih phase dan mulai permainan
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 pb-4">
          {phases.map((phase, i) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              index={i}
              startable={i === 0}
              onStart={onStart}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mb-3 w-full shrink-0 rounded-lg border border-white/10 py-3 text-sm font-semibold text-white/70 hover:text-white"
      >
        Kembali ke Lobby
      </button>
    </div>
  )
}

function PhaseCard({
  phase,
  index,
  startable,
  onStart,
}: {
  phase: Phase
  index: number
  startable: boolean
  onStart: () => void
}) {
  const meta = TYPE_META[phase.content.type] ?? DEFAULT_META
  // ponytail: static placeholder art, same as the old picker card — wire to
  // phase.thumbnailMediaId when the CMS media resolver ships.
  const thumbnail = assets.images.presentation.classroomExample

  return (
    <div className="flex gap-[30px] rounded-[10px] border border-white/10 bg-[#121212] p-3.5">
      <img
        src={thumbnail}
        alt=""
        className="aspect-video w-[45%] shrink-0 rounded-lg object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-white">Phase {index + 1}</span>
          <h3 className="text-helden-yellow text-lg leading-tight font-semibold">{phase.title}</h3>
        </div>

        <div className="flex items-center">
          <Chip icon={meta.icon} text={meta.label} />
          {phase.durationMin !== undefined && (
            <Chip icon="mdi:clock-outline" text={`${phase.durationMin} min`} divided />
          )}
        </div>

        {startable ? (
          <button
            type="button"
            onClick={onStart}
            className="bg-helden-yellow-gradient flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium text-black"
          >
            Mulai Permainan
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1C1C1E] text-sm font-medium text-white/40"
          >
            <Icon icon="mdi:lock" className="size-4" />
            Locked
          </button>
        )}
      </div>
    </div>
  )
}

function Chip({ icon, text, divided }: { icon: string; text: string; divided?: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 text-[13px] text-white ${
        divided ? 'ml-3 border-l border-white/15 pl-3' : ''
      }`}
    >
      <Icon icon={icon} className="size-4 text-white/80" />
      {text}
    </span>
  )
}
