import { assets } from '@/assets'
import type { Phase, PublishedGame } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

// Modular flow level picker. Renders one card per non-idle phase in phaseOrder.
// Idle is the picker's anchor state, so it never appears as a card.
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
  const cards = bundle.phaseOrder
    .map((id) => bundle.phases[id])
    .filter((p): p is Phase => !!p && p.type !== 'idle')
    .map((phase, idx) => ({ phase, level: idx + 1 }))

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#FFB800] sm:text-3xl">Pilih Level</h1>
        <p className="mx-auto mt-2 max-w-md text-xs text-white/70 sm:text-sm">
          Mulai permainan dengan memilih salah satu level di bawah ini.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map(({ phase, level }) => (
          <LevelCard
            key={phase.id}
            phase={phase}
            level={level}
            played={!!played[phase.id]}
            onPick={() => onPick(phase.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onEndSession}
        className="w-full rounded-lg border border-white/10 py-3 text-sm font-semibold text-white/70 hover:text-white"
      >
        Akhiri Sesi
      </button>
    </div>
  )
}

function LevelCard({
  phase,
  level,
  played,
  onPick,
}: {
  phase: Phase
  level: number
  played: boolean
  onPick: () => void
}) {
  const badge = phaseBadge(phase)
  // ponytail: static placeholder art. Wire to phase.thumbnailMediaId when the
  // CMS media resolver ships — schema field already exists (tg-schema 2.1).
  const thumbnail = assets.images.backgrounds.auth
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#121212]">
      <div className="flex items-center justify-between bg-[#1C1C1E] px-4 py-3 text-sm">
        <span className="font-semibold text-white">Level {level}</span>
        <span className="font-semibold text-[#FFB800]">{badge}</span>
      </div>
      <div
        className="aspect-video w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${thumbnail})` }}
      />
      <div className="p-3">
        <button
          type="button"
          disabled={played}
          onClick={onPick}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFB800] py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
        >
          {played ? (
            <>
              <Icon icon="mdi:check-circle" className="size-4" />
              Sudah Dimainkan
            </>
          ) : (
            'Mulai Permainan'
          )}
        </button>
      </div>
    </div>
  )
}

// Card badge label. For minigames, the templateId (e.g. "sort_order", "domino")
// carries the real identity; for other types, the PhaseType is enough.
function phaseBadge(phase: Phase): string {
  if (phase.content.type === 'minigame') return titleCase(phase.content.templateId)
  return typeLabel(phase.type)
}

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    microlearning: 'Microlearning',
    quiz: 'Quiz',
    video: 'Video',
    content: 'Materi',
    codepiece: 'Code Piece',
    codeinput: 'Code Input',
    presentation: 'Presentasi',
    minigame: 'Mini Game',
    idle: 'Idle',
  }
  return map[t] ?? titleCase(t)
}

function titleCase(s: string): string {
  return s
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
