import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'

import { HostBadge } from './HostBadge'

const strokeContainer = '1px solid var(--Stroke-Container, #353535)'

// Picked level's config isn't typed generically on Phase (minigame configs are
// per-template, see PhaseRouter's registry lookup) — this is a display-only
// best-effort read, not the validated parse the actual renderer uses.
function minigameItemCount(phase: Phase): number | undefined {
  if (phase.content.type !== 'minigame') return undefined
  const items = (phase.content.config as Record<string, unknown> | undefined)?.items
  return Array.isArray(items) ? items.length : undefined
}

// Modular picker's confirm step: host taps a level card, sees this "brief the
// room, then start" screen, then taps Mulai Permainan here to actually jump
// the phase pointer. Inserted so hitting a level card doesn't play it live
// immediately in front of everyone.
export function LevelIntro({
  phase,
  level,
  gameType,
  onStart,
}: {
  phase: Phase
  level: number
  gameType: string
  onStart: () => void
}) {
  const itemCount = minigameItemCount(phase)
  const seconds = phase.timer?.seconds

  return (
    <div
      className="flex h-dvh w-full flex-col gap-3 overflow-hidden px-8 py-3"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto p-4 sm:p-6"
        style={{ borderRadius: 16, border: strokeContainer, background: 'rgba(8,8,8,0.20)' }}
      >
        <HostBadge pageName={gameType} />

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Level {level}: {phase.title}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-lg font-extralight text-white/70">
            Kumpulkan pemain, jelaskan misi selanjutnya, lalu tekan tombol di bawah untuk memulai
            permainan.
          </p>
        </div>

        {(itemCount !== undefined || seconds !== undefined) && (
          <div
            className="grid w-full max-w-xl grid-cols-2 gap-3 p-3 sm:p-4"
            style={{ borderRadius: 4, border: strokeContainer }}
          >
            {itemCount !== undefined && (
              <StatBox label="Jumlah Pertanyaan" value={String(itemCount)} />
            )}
            {seconds !== undefined && (
              <StatBox label="Durasi tiap level" value={`${seconds} Detik`} />
            )}
          </div>
        )}

        <div
          className="w-full max-w-xl flex-1 bg-cover bg-center"
          style={{
            borderRadius: 8,
            border: strokeContainer,
            background: 'rgba(0,0,0,0.08)',
            backgroundImage: `url(${assets.images.presentation.classroomExample})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      <button
        type="button"
        onClick={onStart}
        className="bg-helden-yellow-gradient mt-auto w-full shrink-0 rounded-lg py-4 text-center text-lg font-medium text-black"
      >
        Mulai Permainan
      </button>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 p-3 sm:p-4"
      style={{ borderRadius: 8, border: strokeContainer, background: 'rgba(0,0,0,0.08)' }}
    >
      <span className="text-helden-yellow text-base font-medium">{label}</span>
      <span className="text-lg font-bold text-white sm:text-2xl">{value}</span>
    </div>
  )
}
