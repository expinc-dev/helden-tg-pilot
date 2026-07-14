import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { assets } from '@/assets'
import { EndScreen } from '@/pages/extra/end-screen'
import { Header } from '@/pages/host/_shared/Header'
import type { PlayerPresence } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { PhaseRouter } from '@/phases/PhaseRouter'
import { TimerBar } from '@/phases/TimerBar'

import { demoBundle } from '@/lib/demoBundle'
import { nextPhase, startSession } from '@/lib/session/control'
import { usePhasePointer } from '@/lib/sync/usePhasePointer'
import { usePresence, useSessionConfig, useSessionMeta } from '@/lib/sync/useSession'
import { useTeams } from '@/lib/sync/useTeams'
import { useTimer } from '@/lib/sync/useTimer'

export function HostView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const meta = useSessionMeta(sessionId)
  const config = useSessionConfig(sessionId)
  const pointer = usePhasePointer(sessionId)
  const { players, centrals } = usePresence(sessionId)
  const teams = useTeams(sessionId)

  const phase = pointer ? demoBundle.phases[pointer.activePhaseId] : null
  const timer = useTimer(sessionId, phase)

  const advancedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!sessionId || !phase) return
    if (
      timer.active &&
      timer.expired &&
      phase.timer?.autoAdvanceOnExpire &&
      pointer?.activePhaseId === phase.id &&
      advancedRef.current !== phase.id
    ) {
      advancedRef.current = phase.id
      void nextPhase(sessionId, phase.id)
    }
  }, [sessionId, phase, timer.active, timer.expired, pointer?.activePhaseId])

  if (!meta || !config || !sessionId) {
    return <div className="p-8 text-sm text-gray-500">Loading session {sessionId}…</div>
  }

  const playerEntries = Object.entries(players) as [string, PlayerPresence][]
  const centralEntries = Object.entries(centrals) as [string, { connected: boolean }][]
  const connectedPlayers = playerEntries.filter(([, p]) => p.connected).length
  const connectedCentrals = centralEntries.filter(([, c]) => c.connected).length

  if (meta.status === 'lobby') {
    return (
      <div className="min-h-dvh w-full bg-black bg-cover bg-center p-3 sm:p-6">
        <div
          className="flex min-h-[calc(100dvh-2rem)] w-full flex-col gap-6 overflow-y-auto p-3 sm:p-8"
          style={{
            backgroundImage: `url(${assets.images.backgrounds.auth})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'top',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <Header />

          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#FFB800] sm:text-3xl">Panel Kontrol Hosting</h1>
            <p className="mx-auto mt-2 max-w-md text-xs text-white/70 sm:text-sm">
              Permainan dapat dimulai setelah Pemain dan Perangkat Utama bergabung menggunakan kode
              room sesuai perannya.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#121212] p-4 sm:gap-5 sm:rounded-3xl sm:p-6">
            <RoleCard
              label="Perangkat Utama"
              joinCode={config.joinCode}
              role="central"
              count={connectedCentrals}
            >
              {centralEntries.length === 0 ? (
                <p className="text-xs text-white/50">Belum ada Perangkat Utama yang bergabung.</p>
              ) : (
                <ul className="space-y-1">
                  {centralEntries.map(([id, c]) => (
                    <li
                      key={id}
                      className="flex items-center justify-between rounded-md bg-[#0a0a0a] px-3 py-2 text-sm text-white/90"
                    >
                      <span className="font-mono text-xs text-white/60">{id}</span>
                      <StatusDot connected={c.connected} />
                    </li>
                  ))}
                </ul>
              )}
            </RoleCard>
            <RoleCard
              label="Pemain"
              joinCode={config.joinCode}
              role="player"
              count={connectedPlayers}
            >
              {playerEntries.length === 0 ? (
                <p className="text-xs text-white/50">Belum ada pemain yang bergabung.</p>
              ) : config.allowTeams ? (
                <PlayersByTeam players={playerEntries} teams={teams} />
              ) : (
                <PlayerRows players={playerEntries} />
              )}
            </RoleCard>

            {config.allowTeams && (
              <div className="rounded-xl border border-white/5 bg-[#1C1C1E] p-3 text-sm text-white/80">
                <span className="font-semibold text-[#FFB800]">Mode Tim aktif</span>
                {config.maxMembers
                  ? ` · maks. ${config.maxMembers} anggota per tim`
                  : ' · tanpa batas anggota'}
              </div>
            )}

            <button
              type="button"
              onClick={() => startSession(sessionId)}
              className="w-full rounded-2xl bg-[#FFB800] py-4 text-center text-base font-bold text-black sm:rounded-3xl sm:py-[18px] sm:text-lg"
            >
              Mulai Permainan
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Live / paused / ended — original functional view (unchanged behavior).
  return (
    <div className="flex min-h-screen flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">
          {meta.name ? `${meta.name} — ` : ''}Host — {meta.status}
        </h1>
        <p className="text-xs text-gray-500">{sessionId}</p>
      </div>

      {meta.status === 'live' &&
        (() => {
          const order = demoBundle.phaseOrder
          const isLast =
            !!pointer?.activePhaseId && order.indexOf(pointer.activePhaseId) === order.length - 1
          return (
            <button
              onClick={() => nextPhase(sessionId, pointer?.activePhaseId)}
              className="w-fit rounded border px-4 py-2"
            >
              {isLast ? 'End session' : 'Next phase'}
            </button>
          )
        })()}

      {meta.status === 'ended' && <EndScreen sessionId={sessionId} />}

      {meta.status === 'live' && phase && (
        <div className="rounded border p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">Now playing: {phase.id}</p>
            <TimerBar sessionId={sessionId} phase={phase} role="host" />
          </div>
          <PhaseRouter
            phase={phase}
            phaseStartMs={pointer?.changedAt}
            role="host"
            sessionId={sessionId}
            allowTeams={config.allowTeams}
          />
        </div>
      )}
    </div>
  )
}

function RoleCard({
  label,
  joinCode,
  role,
  count,
  children,
}: {
  label: string
  joinCode: string
  role: 'central' | 'player'
  count: number
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/5 bg-[#1C1C1E] p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-[#FFB800] bg-black/40 px-3 py-2 text-left"
      >
        <span className="text-sm font-semibold text-[#FFB800] sm:text-base">{label}</span>
        <Icon
          icon="mdi:chevron-down"
          className={`size-5 text-[#FFB800] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {/* ponytail: image placeholder — swap when asset lands */}
          <div className="h-28 rounded-lg bg-[#0a0a0a] sm:h-40" aria-hidden />
          <div className="flex items-center justify-between px-1 py-1 text-xs text-white/80 sm:text-sm">
            <span>Kode Ruangan</span>
            <span className="flex items-center gap-2">
              <span className="font-semibold text-white">{joinCode}</span>
              <button
                type="button"
                aria-label={`Copy ${role} code`}
                onClick={() => {
                  const url = `${window.location.origin}/join/${role}?code=${joinCode}`
                  void navigator.clipboard?.writeText(url)
                }}
                className="min-h-9 rounded bg-[#FFB800] px-3 py-1.5 text-xs font-bold text-black"
              >
                copy
              </button>
            </span>
          </div>
          <div className="flex items-center justify-between px-1 py-1 text-xs text-white/80 sm:text-sm">
            <span>Perangkat</span>
            <span className="font-semibold text-white">{count} Perangkat</span>
          </div>
          {children && <div className="border-t border-white/5 pt-3">{children}</div>}
        </div>
      )}
    </div>
  )
}

function PlayerRows({ players }: { players: [string, PlayerPresence][] }) {
  return (
    <ul className="space-y-1">
      {players.map(([id, p]) => (
        <li
          key={id}
          className="flex items-center justify-between rounded-md bg-[#1C1C1E] px-3 py-2 text-sm text-white/90"
        >
          <span>{p.name}</span>
          <StatusDot connected={p.connected} />
        </li>
      ))}
    </ul>
  )
}

function PlayersByTeam({
  players,
  teams,
}: {
  players: [string, PlayerPresence][]
  teams: { id: string; teamName?: string; memberCount: number }[]
}) {
  const teamName = new Map(teams.map((t) => [t.id, t.teamName]))
  const grouped = new Map<string, [string, PlayerPresence][]>()
  for (const entry of players) {
    const key = entry[1].teamId ?? '__unassigned__'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(entry)
  }
  const sections = [...grouped.entries()].sort(([a], [b]) =>
    a === '__unassigned__' ? 1 : b === '__unassigned__' ? -1 : a.localeCompare(b)
  )
  return (
    <div className="space-y-3">
      {sections.map(([teamId, rows]) => (
        <div key={teamId}>
          <p className="mb-1 text-xs font-semibold text-white/60">
            {teamId === '__unassigned__' ? 'Unassigned' : (teamName.get(teamId) ?? teamId)} (
            {rows.length})
          </p>
          <PlayerRows players={rows} />
        </div>
      ))}
    </div>
  )
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      title={connected ? 'connected' : 'offline'}
      className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-500'}`}
    />
  )
}
