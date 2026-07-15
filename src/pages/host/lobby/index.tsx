import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { assets } from '@/assets'
import { EndScreen } from '@/pages/extra/end-screen'
import { Header } from '@/pages/host/_shared/Header'
import { HostPresenceSpread } from '@/pages/host/_shared/HostPresenceSpread'
import { PickerGrid } from '@/pages/host/_shared/PickerGrid'
import type { PlayerPresence } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'

import { PhaseRouter } from '@/phases/PhaseRouter'
import { TimerBar } from '@/phases/TimerBar'

import { demoBundle } from '@/lib/demoBundle'
import { endLevel, endSession, jumpToPhase, nextPhase, startSession } from '@/lib/session/control'
import { usePhasePointer } from '@/lib/sync/usePhasePointer'
import { usePlayedPhases } from '@/lib/sync/usePlayedPhases'
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
  const played = usePlayedPhases(sessionId)
  const flowMode = demoBundle.flowMode ?? 'sequential'
  const isModular = flowMode === 'modular-open' || flowMode === 'modular-progressive'
  const onPicker = isModular && phase?.type === 'idle'

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
      // Modular: timer-expiry auto-advance means "end this level → back to picker",
      // not "next phase in order". Sequence: original nextPhase behaviour.
      void (isModular ? endLevel(sessionId, phase.id) : nextPhase(sessionId, phase.id))
    }
  }, [sessionId, phase, timer.active, timer.expired, pointer?.activePhaseId, isModular])

  if (!meta || !config || !sessionId) {
    return <div className="p-8 text-sm text-gray-500">Loading session {sessionId}…</div>
  }

  const playerEntries = Object.entries(players) as [string, PlayerPresence][]
  const centralEntries = Object.entries(centrals) as [string, { connected: boolean }][]
  const connectedCentrals = centralEntries.filter(([, c]) => c.connected).length

  if (meta.status === 'lobby') {
    const copyJoinLink = (role: 'central' | 'player') => {
      const url = `${window.location.origin}/join/${role}?code=${config.joinCode}`
      void navigator.clipboard?.writeText(url)
      toast.success('Link disalin')
    }
    return (
      // <div className="min-h-dvh w-full bg-black bg-cover bg-center p-3 sm:p-6">
      <div
        className="flex min-h-dvh w-full flex-col gap-6 overflow-y-auto p-3 sm:p-8"
        style={{
          backgroundImage: `url(${assets.images.backgrounds.auth})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Header />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#FFB800] sm:text-3xl">Panel Kontrol HostLevel</h1>
          <p className="mx-auto mt-2 max-w-md text-xs text-white/70 sm:text-sm">
            Permainan dapat dimulai setelah Pemain dan Perangkat Utama bergabung
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard title="Layar Utama">
            <InfoRow label="Kode Ruangan" onCopy={() => copyJoinLink('central')}>
              <span className="font-semibold text-white">{config.joinCode}</span>
            </InfoRow>
            <InfoRow label="Perangkat">
              <span className="font-semibold text-white">{connectedCentrals} Perangkat</span>
            </InfoRow>
          </SectionCard>

          <SectionCard title={`Pemain ${config.allowTeams ? '(Multiplayer)' : '(Single Player)'}`}>
            <InfoRow label="Kode Ruangan" onCopy={() => copyJoinLink('player')}>
              <span className="font-semibold text-white">{config.joinCode}</span>
            </InfoRow>

            {config.allowTeams ? (
              <TeamList players={playerEntries} teams={teams} />
            ) : playerEntries.length === 0 ? (
              <p className="px-1 text-xs text-white/50">Belum ada pemain yang bergabung.</p>
            ) : (
              <PlayerRows players={playerEntries} />
            )}
          </SectionCard>

          <button
            type="button"
            onClick={() => startSession(sessionId)}
            className="w-full rounded-lg bg-[#FFB800] py-4 text-center text-base font-bold text-black sm:rounded-lg sm:py-[18px] sm:text-lg"
          >
            Mulai Permainan
          </button>
        </div>
      </div>
      // </div>
    )
  }

  // Live: modular → picker (when at idle) or phase render + End level.
  //       sequence → original Next phase button.
  if (meta.status === 'live' && onPicker) {
    return (
      <div
        className="flex min-h-dvh flex-col gap-6 p-4 sm:p-8"
        style={{
          backgroundImage: `url(${assets.images.backgrounds.auth})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <PickerGrid
          bundle={demoBundle}
          played={played}
          onPick={(phaseId) => jumpToPhase(sessionId, phaseId)}
          onEndSession={() => endSession(sessionId)}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">
          {meta.name ? `${meta.name} — ` : ''}Host — {meta.status}
        </h1>
        <p className="text-xs text-gray-500">{sessionId}</p>
      </div>

      {meta.status === 'live' &&
        phase &&
        (isModular ? (
          <button
            onClick={() => endLevel(sessionId, phase.id)}
            className="w-fit rounded border px-4 py-2"
          >
            Akhiri Level
          </button>
        ) : (
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
          })()
        ))}

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

      {meta.status === 'live' && phase && (
        <HostPresenceSpread sessionId={sessionId} phase={phase} players={players} />
      )}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#121212] p-4 sm:rounded-3xl sm:p-6">
      <div className="mb-3 rounded-lg bg-[#1C1C1E] px-4 py-2 text-sm font-semibold text-[#FFB800] sm:text-base">
        {title}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function InfoRow({
  label,
  onCopy,
  children,
}: {
  label: string
  onCopy?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#1C1C1E] px-4 py-3 text-sm text-white/80 sm:text-base">
      <span className="flex items-center gap-2">
        {onCopy && <Icon icon="mdi:key-outline" className="size-4 text-white/60" />}
        {label}
      </span>
      <span className="flex items-center gap-2">
        {children}
        {onCopy && (
          <Icon
            onClick={onCopy}
            icon="mdi:content-copy"
            className="size-4 cursor-pointer text-yellow-300 hover:text-yellow-400"
          />
        )}
      </span>
    </div>
  )
}

function TeamList({
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
  if (sections.length === 0) {
    return <p className="px-1 text-xs text-white/50">Belum ada tim.</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {sections.map(([teamId, rows]) => (
        <TeamRow
          key={teamId}
          name={teamId === '__unassigned__' ? 'Unassigned' : (teamName.get(teamId) ?? teamId)}
          rows={rows}
        />
      ))}
    </div>
  )
}

function TeamRow({ name, rows }: { name: string; rows: [string, PlayerPresence][] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-[#1C1C1E]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm text-white/90 sm:text-base"
      >
        <span className="flex items-center gap-2">
          <Icon icon="mdi:account-group" className="size-4 text-white/60" />
          {name}
        </span>
        <span className="flex items-center gap-2 text-white/60">
          <span>{rows.length} Pemain</span>
          <Icon
            icon="mdi:chevron-right"
            className={`size-4 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </span>
      </button>
      {open && (
        <ul className="flex flex-col gap-1 border-t border-white/5 px-2 py-2">
          {rows.map(([id, p]) => (
            <li
              key={id}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-white/90"
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:account-circle-outline" className="size-4 text-white/60" />
                {p.name}
              </span>
              <StatusDot connected={p.connected} />
            </li>
          ))}
        </ul>
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

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      title={connected ? 'connected' : 'offline'}
      className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-500'}`}
    />
  )
}
