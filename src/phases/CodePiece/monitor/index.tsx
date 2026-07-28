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

// Big-screen view — same full-bleed background + centered layout as
// CentralQuiz/CentralSortOrder/CentralReflection, so this doesn't float as a
// small dark card on central's own plain (unstyled) page shell.
export function CentralCodePiece({ sessionId, phase }: { sessionId: string; phase: Phase }) {
  const teams = useTeams(sessionId)
  const { players } = usePresence(sessionId)

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 overflow-y-auto p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Icon icon="mdi:puzzle-outline" className="size-16 text-[#FFB800]" />
      <h1 className="text-center text-4xl font-bold text-white drop-shadow-lg">{phase.title}</h1>

      <div className="flex w-full max-w-md flex-col gap-4">
        {teams.length > 0 ? (
          teams.map((t) => (
            <div key={t.id} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-white/60">{t.teamName ?? t.id}</p>
              <FragmentRows
                sessionId={sessionId}
                phaseId={phase.id}
                teamId={t.id}
                players={players}
              />
            </div>
          ))
        ) : (
          <FragmentRows
            sessionId={sessionId}
            phaseId={phase.id}
            teamId={undefined}
            players={players}
          />
        )}
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

  if (teams.length > 0) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#181818] p-4">
        {teams.map((t) => (
          <div key={t.id} className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-white/50">{t.teamName ?? t.id}</p>
            <FragmentRows
              sessionId={sessionId}
              phaseId={phase.id}
              teamId={t.id}
              players={players}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#181818] p-4">
      <FragmentRows sessionId={sessionId} phaseId={phase.id} teamId={undefined} players={players} />
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
    return <p className="text-xs text-white/30">Menunggu urutan bagian dibekukan...</p>
  }
  return (
    <div className="flex flex-col gap-1.5">
      {order.map((id, i) => (
        <div
          key={id}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <span className="text-white/80">{players[id]?.name ?? id.slice(0, 8)}</span>
          <span className="text-white/40">
            Bagian {i + 1}/{order.length}
          </span>
        </div>
      ))}
    </div>
  )
}
