import { useState } from 'react'

import { assets } from '@/assets'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FullscreenButton } from '@/components/FullscreenToggle'
import { useAdvanceLocked } from '@/pages/host/_shared/advanceGateContext'

import { type LevelGroup, type LevelStatus, levelProgressPct } from '../levels'

// Host's "Pilih Level" screen (Figma "Level Selection") for a mid-game idle
// phase in a sequential bundle (see ../levels.ts). Levels are played in order:
// done levels carry a check, the next one is the only tappable card, the rest
// are dimmed. A confirm step guards the tap, then onPick jumps the phase pointer
// to that level's first phase. Players keep seeing the passive idle screen
// ("Lihat Layar Utama!") meanwhile.
export function LevelSelect({
  groups,
  onPick,
}: {
  groups: LevelGroup[]
  onPick: (firstPhaseId: string) => void
}) {
  const [pending, setPending] = useState<LevelGroup | null>(null)
  const locked = useAdvanceLocked()
  // A confirm must not outlive the screen it was opened on (an advance started
  // or just landed): drop it instead of letting a late confirm be silently refused.
  if (locked && pending) setPending(null)
  const pct = levelProgressPct(groups)

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <header className="flex w-full shrink-0 items-center justify-between border-b border-[#303030] bg-[rgba(8,8,8,0.2)] py-4 pr-4 pl-6">
        <img src={assets.images.logos.helden.sm} alt="Helden Inc." className="h-3.5 w-auto" />
        <FullscreenButton className="size-6 bg-black/30" iconClassName="size-5 text-yellow-300" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-5 pt-[19px] pb-12">
        <section className="flex min-h-0 flex-1 flex-col items-center gap-6 overflow-clip rounded-lg border border-[#353535] bg-[rgba(8,8,8,0.2)] px-[19px] pt-[31px] pb-[23px]">
          <div className="flex w-full shrink-0 flex-col gap-1.5 text-center leading-[1.2]">
            <h1 className="text-xl leading-[1.2] font-semibold tracking-[-0.04em] text-white">
              Pilih Level
            </h1>
            <p className="text-base leading-[1.2] font-medium tracking-[-0.04em] text-[#ccc]">
              Selesaikan semua secara berurutan
            </p>
          </div>

          <ProgressBar pct={pct} />

          <div className="min-h-0 w-[calc(100%+0.5rem)] flex-1 [scrollbar-width:thin] [scrollbar-color:#353535_transparent] overflow-y-auto px-1 py-1">
            <div className="grid grid-cols-2 gap-4">
              {groups.map((g, i) => (
                <LevelTile
                  key={g.id}
                  group={g}
                  index={i}
                  locked={locked}
                  onPick={() => setPending(g)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {pending && (
        <ConfirmDialog
          title={`Mulai ${pending.label}?`}
          message="Pastikan seluruh pemain siap sebelum level dimulai."
          confirmLabel="Mulai"
          cancelLabel="Kembali"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const g = pending
            setPending(null)
            onPick(g.id)
          }}
        />
      )}
    </div>
  )
}

// The fill never shrinks below 26px: that is the width of the "5%" label pill in
// the design, so a fresh game still reads as a bar with a value on it.
function ProgressBar({ pct }: { pct: number }) {
  const fill = `max(${pct}%, 26px)`
  return (
    <div className="bg-helden-pill-gradient w-full shrink-0 overflow-clip rounded-lg border border-[#353535] py-[7px] pr-[7px] pl-[15px] backdrop-blur-[21px]">
      <div
        role="progressbar"
        aria-label="Progres keseluruhan"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="relative h-8 w-full"
      >
        <div className="bg-helden-photo-gradient absolute top-[5.93px] left-0 h-[22px] w-[94.51%] overflow-clip rounded-2xl border-[0.5px] border-[rgba(177,177,177,0.32)] shadow-[0px_1px_7px_0px_rgba(0,0,0,0.08)]">
          <div className="absolute inset-y-0 left-0 bg-[#fcdc07]" style={{ width: fill }} />
          <div
            className="absolute top-[calc(50%+1px)] flex h-[30px] w-[7px] -translate-y-1/2 items-center justify-center"
            style={{ left: `calc(${fill} - 0.5px)` }}
          >
            <div className="flex-none rotate-90">
              <img
                src={assets.images.levelSelect.progressTip}
                alt=""
                className="block h-[7px] w-[30px] max-w-none"
              />
            </div>
          </div>
          <span
            className="absolute top-[10.5px] flex h-6 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center text-[10px] leading-[1.2] font-bold text-black"
            style={{ left: `calc(${fill} - 9.5px)`, fontFeatureSettings: '"lnum" 1, "pnum" 1' }}
          >
            {pct}%
          </span>
        </div>

        <div className="bg-helden-yellow-gradient absolute top-0 right-0 flex size-8 items-center justify-center rounded-full p-1">
          <img
            src={assets.images.levelSelect.trophy}
            alt=""
            className="block h-[15.566px] w-[15.289px] max-w-none"
          />
        </div>
      </div>
    </div>
  )
}

const STATUS_LABEL: Record<LevelStatus, string> = {
  done: 'selesai',
  available: 'siap dimulai',
  locked: 'terkunci',
}

// Done and available cards are lit (yellow border, light scrim); locked ones are
// dimmed. Only the available card is interactive. The photo is a shared
// placeholder, as in the design, until phases carry their own thumbnail.
function LevelTile({
  group,
  index,
  locked,
  onPick,
}: {
  group: LevelGroup
  index: number
  locked: boolean
  onPick: () => void
}) {
  const { status } = group
  const lit = status !== 'locked'

  return (
    <button
      type="button"
      disabled={status !== 'available' || locked}
      onClick={onPick}
      aria-label={`${group.label}, ${STATUS_LABEL[status]}`}
      className={`relative flex aspect-[147/248] w-full flex-col items-end justify-end overflow-clip rounded-lg border-[0.5px] text-left shadow-[0px_0px_12px_0px_rgba(253,164,0,0.2)] ${
        lit ? 'border-helden-yellow' : 'border-white opacity-80'
      } ${status === 'available' ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-lg">
        <img
          src={assets.images.levelSelect.cardPhoto}
          alt=""
          className="absolute size-full max-w-none rounded-lg object-cover"
        />
        <span className={`absolute inset-0 rounded-lg ${lit ? 'bg-black/30' : 'bg-black/90'}`} />
      </span>

      {status === 'done' && (
        <img
          src={assets.images.levelSelect.doneBadge}
          alt=""
          className="relative mb-auto block h-[46.582px] w-[69.725px] max-w-none shrink-0"
        />
      )}

      <span
        className="relative flex h-14 w-full shrink-0 flex-col items-start rounded-b-lg p-3"
        style={{
          backgroundImage:
            'linear-gradient(180.89deg, rgba(6, 6, 5, 0) 1.96%, rgba(6, 6, 5, 0.9) 57.16%)',
        }}
      >
        <span className="flex w-full items-center gap-1.5 text-center leading-[1.2] font-normal whitespace-nowrap">
          <span className="text-helden-yellow shrink-0 text-[26px] tracking-[-0.04em]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="flex min-w-0 flex-col items-start gap-0.5 text-shadow-[0px_0px_12px_rgba(253,164,0,0.2)]">
            <span className="text-helden-yellow max-w-full truncate text-xs tracking-[-0.04em]">
              {group.label}
            </span>
            <span className="text-[8px] tracking-[-0.04em] text-white">
              {group.phaseIds.length} tahap
            </span>
          </span>
        </span>
      </span>
    </button>
  )
}
