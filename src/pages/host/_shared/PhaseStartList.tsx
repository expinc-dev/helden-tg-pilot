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
      className="flex h-dvh w-full flex-col gap-3 overflow-hidden px-[47px] pt-[48px] pb-[45px]"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Header />

      <div className="flex min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#353535_transparent] flex-col gap-16 overflow-y-auto rounded-2xl border border-[#353535] bg-[rgba(8,8,8,0.2)] px-8 pt-10 pb-8">
        <div className="flex flex-col items-center gap-12">
          <HostBadge pageName={gameType} />
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-[32px] leading-normal font-bold tracking-[-0.04em] text-[#d9d9d9]">
              Pilih Phase
            </h1>
            <p className="text-2xl leading-[23px] font-light tracking-[-0.04em] text-[#ccc]">
              Pilih phase dan mulai permainan
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
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
        className="h-12 w-full shrink-0 rounded-lg border border-[#353535] text-base font-medium tracking-[-0.04em] text-white/70 hover:text-white"
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
    <div className="flex shrink-0 items-stretch overflow-clip rounded-lg border border-[#353535] shadow-[0_0_12px_rgba(253,164,0,0.2)]">
      <div className="flex min-w-0 flex-1 p-4">
        <div className="relative min-h-[150px] w-full flex-1">
          <img
            src={thumbnail}
            alt=""
            className="absolute inset-0 size-full rounded-lg object-cover"
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-6 py-6 pr-6 pl-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-base tracking-[-0.04em] text-white [text-shadow:0_0_12px_rgba(253,164,0,0.2)]">
              Phase {index + 1}
            </span>
            <h3 className="text-helden-yellow text-lg leading-[23px] font-medium tracking-[-0.04em]">
              {phase.title}
            </h3>
          </div>

          <div className="flex items-start gap-2">
            <Chip icon={meta.icon} text={meta.label} />
            {phase.durationMin !== undefined && (
              <Chip icon="mdi:clock-outline" text={`${phase.durationMin} min`} divided />
            )}
          </div>
        </div>

        {startable ? (
          <button
            type="button"
            onClick={onStart}
            className="bg-helden-yellow-gradient flex h-10 w-full shrink-0 items-center justify-center rounded-lg px-8 text-base font-medium tracking-[-0.04em] text-black"
          >
            Mulai Permainan
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1b1b1b] px-8 text-base font-medium tracking-[-0.04em] text-white/25"
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
      className={`flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-sm tracking-[-0.04em] text-white ${
        divided ? 'border-l border-[#353535]' : ''
      }`}
    >
      <Icon icon={icon} className="size-4 shrink-0" />
      {text}
    </span>
  )
}
