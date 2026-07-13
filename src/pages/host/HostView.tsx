import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

import { assets } from '@/assets'
import { EndScreen } from '@/pages/_shared/EndScreen'
import type { PlayerPresence } from '@helden-inc/tg-schema'

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
      <LobbyShell>
        <div className="mb-5 text-center sm:mb-6">
          <h1 className="text-2xl font-bold text-[#FFB800] sm:text-3xl">Panel Kontrol Hosting</h1>
          <p className="mx-auto mt-2 max-w-md text-xs text-white/70 sm:text-sm">
            Permainan dapat dimulai setelah Pemain dan Perangkat Utama bergabung menggunakan kode
            room sesuai perannya.
          </p>
        </div>

        <RoleCard
          label="Perangkat Utama"
          joinCode={config.joinCode}
          role="central"
          count={connectedCentrals}
        />
        <div className="h-4" />
        <RoleCard
          label="Pemain"
          joinCode={config.joinCode}
          role="player"
          count={connectedPlayers}
        />

        <button
          type="button"
          onClick={() => startSession(sessionId)}
          className="mt-6 w-full rounded-2xl bg-[#FFB800] py-4 text-center text-base font-bold text-black sm:mt-8 sm:rounded-3xl sm:py-[18px] sm:text-lg"
        >
          Mulai Permainan
        </button>

        <Advanced
          allowTeams={!!config.allowTeams}
          maxMembers={config.maxMembers}
          players={playerEntries}
          centrals={centralEntries}
          teams={teams}
        />
      </LobbyShell>
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

function LobbyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-black bg-cover bg-center p-3 sm:p-6">
      <div
        className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-md flex-col rounded-3xl p-4 sm:min-h-[calc(100vh-3rem)] sm:max-w-2xl sm:rounded-[32px] sm:p-6"
        style={{
          backgroundImage: `url(${assets.images.background.auth})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <header className="mb-6 flex items-center justify-between rounded-full bg-black/60 px-4 py-3 sm:mb-8 sm:px-5 sm:py-4">
          <span className="text-xl font-bold text-[#FFB800] sm:text-2xl">Helden Inc.</span>
          <button
            type="button"
            aria-label="Expand"
            className="h-10 w-10 rounded-full bg-[#FFB800] text-black"
          />
        </header>
        {children}
      </div>
    </div>
  )
}

function RoleCard({
  label,
  joinCode,
  role,
  count,
}: {
  label: string
  joinCode: string
  role: 'central' | 'player'
  count: number
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#121212] p-3 sm:rounded-3xl sm:p-4">
      <div className="mb-3 rounded-lg border border-[#FFB800] bg-black/40 px-3 py-2 sm:rounded-xl sm:px-4">
        <span className="text-sm font-semibold text-[#FFB800] sm:text-base">{label}</span>
      </div>
      {/* ponytail: image placeholder — swap when asset lands */}
      <div className="mb-4 h-28 rounded-lg bg-[#0a0a0a] sm:h-40 sm:rounded-xl" aria-hidden />
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
    </div>
  )
}

function Advanced({
  allowTeams,
  maxMembers,
  players,
  centrals,
  teams,
}: {
  allowTeams: boolean
  maxMembers?: number
  players: [string, PlayerPresence][]
  centrals: [string, { connected: boolean }][]
  teams: { id: string; teamName?: string; memberCount: number }[]
}) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      {allowTeams && (
        <div className="rounded-2xl border border-white/5 bg-[#121212] p-4 text-sm text-white/80">
          <span className="font-semibold text-[#FFB800]">Mode Tim aktif</span>
          {maxMembers ? ` · maks. ${maxMembers} anggota per tim` : ' · tanpa batas anggota'}
        </div>
      )}

      <DeviceList title={`Pemain (${players.length})`} empty="Belum ada pemain yang bergabung.">
        {players.length > 0 &&
          (allowTeams ? (
            <PlayersByTeam players={players} teams={teams} />
          ) : (
            <PlayerRows players={players} />
          ))}
      </DeviceList>

      <DeviceList
        title={`Perangkat Utama (${centrals.length})`}
        empty="Belum ada Perangkat Utama yang bergabung."
      >
        {centrals.length > 0 && (
          <ul className="space-y-1">
            {centrals.map(([id, c]) => (
              <li
                key={id}
                className="flex items-center justify-between rounded-md bg-[#1C1C1E] px-3 py-2 text-sm text-white/90"
              >
                <span className="font-mono text-xs text-white/60">{id}</span>
                <StatusDot connected={c.connected} />
              </li>
            ))}
          </ul>
        )}
      </DeviceList>
    </div>
  )
}

function DeviceList({
  title,
  empty,
  children,
}: {
  title: string
  empty: string
  children: React.ReactNode
}) {
  const isEmpty = !children || (Array.isArray(children) && children.every((c) => !c))
  return (
    <div className="rounded-2xl border border-white/5 bg-[#121212] p-4">
      <p className="mb-3 text-sm font-semibold text-white/90">{title}</p>
      {isEmpty ? <p className="text-xs text-white/50">{empty}</p> : children}
    </div>
  )
}

function PlayerRows({ players }: { players: [string, PlayerPresence][] }) {
  return (
    <ul className="space-y-1">
      {players.map(([id, p]) => (
        <li key={id} className="flex items-center justify-between">
          <span className="text-white">{p.name}</span>
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
