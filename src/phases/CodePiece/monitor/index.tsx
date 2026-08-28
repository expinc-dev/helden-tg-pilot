import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { usePresence } from '@/lib/sync/useSession'
import { useTeams } from '@/lib/sync/useTeams'

import { useFragmentOrder } from '../lib'

// No "solve status" here — that's CodeInput's job (this phase is ungraded,
// just a fragment hand-out). Shown to host AND central so neither stares at
// a blank screen while this phase is live: who has which piece, per team
// when team mode is on, room-wide otherwise.

// Big-screen view — styled with Option 2 split terminal layout,
// full-bleed background + semi-transparent dark glass cards.
export function CentralCodePiece({ sessionId, phase }: { sessionId: string; phase: Phase }) {
  const teams = useTeams(sessionId)
  const { players } = usePresence(sessionId)

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-8 lg:p-12"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="grid h-full max-h-[85vh] w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Panel: Terminal Info */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-md lg:col-span-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-[#FDDB00]/30 bg-[#FDDB00]/10">
                <Icon icon="mdi:puzzle-outline" className="size-6 text-[#FDDB00]" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#FDDB00]">Sistem Terminal</h2>
            </div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow-md">{phase.title}</h1>
            <p className="text-sm leading-relaxed text-white/70">
              Fragmen kode telah dikirimkan ke perangkat masing-masing pemain. Gabungkan semua
              potongan dengan tim Anda untuk menyelesaikan urutan kode.
            </p>
            {phase.content.type === 'codepiece' && phase.content.hint && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                <span className="font-semibold text-[#FDDB00]">Petunjuk: </span>
                {phase.content.hint}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
            <span>Fase Aktif</span>
            <span className="font-semibold text-[#FDDB00]">{phase.title}</span>
          </div>
        </div>

        {/* Right Panel: Fragment Distribution Monitor */}
        <div className="flex flex-col overflow-y-auto rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-md lg:col-span-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:account-group-outline" className="size-5 text-[#FDDB00]" />
              <h3 className="text-lg font-bold text-white">Distribusi Fragmen Tim</h3>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
              {teams.length > 0 ? `${teams.length} Tim` : 'Semua Pemain'}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
            {teams.length > 0 ? (
              teams.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#121214]/80 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">{t.teamName ?? t.id}</p>
                    <span className="text-xs text-white/40">Tim</span>
                  </div>
                  <FragmentRows
                    sessionId={sessionId}
                    phaseId={phase.id}
                    teamId={t.id}
                    players={players}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#121214]/80 p-5">
                <FragmentRows
                  sessionId={sessionId}
                  phaseId={phase.id}
                  teamId={undefined}
                  players={players}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Host's embedded view — sits inside the host page's own already-dark card
// (matches HostQuiz/HostSortOrder), so it supplies its own dark panel rather
// than a full-bleed background.
export function HostCodePiece({ sessionId, phase }: { sessionId: string; phase: Phase }) {
  const teams = useTeams(sessionId)
  const { players } = usePresence(sessionId)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#181818] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:puzzle-outline" className="size-5 text-[#FDDB00]" />
          <h2 className="text-sm font-bold text-white">Distribusi Fragmen Kode</h2>
        </div>
        <span className="text-xs text-white/50">{phase.title}</span>
      </div>

      {teams.length > 0 ? (
        <div className="flex flex-col gap-3">
          {teams.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-2 rounded-lg border border-white/5 bg-[#121214] p-3"
            >
              <p className="text-xs font-semibold text-white/70">{t.teamName ?? t.id}</p>
              <FragmentRows
                sessionId={sessionId}
                phaseId={phase.id}
                teamId={t.id}
                players={players}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/5 bg-[#121214] p-3">
          <FragmentRows
            sessionId={sessionId}
            phaseId={phase.id}
            teamId={undefined}
            players={players}
          />
        </div>
      )}
    </div>
  )
}

function FragmentRows({
  sessionId,
  phaseId,
  teamId,
  players,
}: {
  sessionId: string
  phaseId: string
  teamId: string | undefined
  players: Record<string, { name?: string }>
}) {
  const order = useFragmentOrder(sessionId, phaseId, teamId)
  if (order.length === 0) {
    return <p className="text-xs text-white/40">Menunggu urutan bagian dibekukan...</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {order.map((id, i) => (
        <div
          key={id}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm"
        >
          <div className="flex items-center gap-2">
            <Icon icon="mdi:account" className="size-4 text-white/40" />
            <span className="font-medium text-white/90">{players[id]?.name ?? id.slice(0, 8)}</span>
          </div>
          <span className="rounded-md bg-[#FDDB00]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[#FDDB00]">
            Bagian {i + 1}/{order.length}
          </span>
        </div>
      ))}
    </div>
  )
}
