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
import { VideoHostScreen } from '@/phases/Video'

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
    return (
      <LobbyView
        sessionId={sessionId}
        joinCode={config.joinCode}
        allowTeams={!!config.allowTeams}
        connectedCentrals={connectedCentrals}
        teams={teams}
        players={playerEntries}
      />
    )
  }

  // Video-phase host screen: rendered top-level so its full-bleed layout
  // escapes the standard live wrapper's padding (which would otherwise leak
  // the parent background as a white bar on TabletFrame simulations). The
  // bottom yellow button advances the phase — endLevel in modular flow,
  // nextPhase in sequential.
  if (meta.status === 'live' && phase && phase.content.type === 'video') {
    const advance = isModular
      ? () => endLevel(sessionId, phase.id)
      : () => nextPhase(sessionId, pointer?.activePhaseId)
    return (
      <VideoHostScreen
        sessionId={sessionId}
        allowTeams={!!config.allowTeams}
        videoTitle={phase.title}
        videoUrl={phase.content.videoUrl}
        onAdvance={advance}
        advanceLabel="Tahap selanjutnya"
      />
    )
  }

  // Live: modular → picker (when at idle) or phase render + End level.
  //       sequence → original Next phase button.
  if (meta.status === 'live' && onPicker) {
    return (
      <div
        className="flex min-h-dvh flex-col gap-6"
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
    <div className="flex min-h-dvh flex-col gap-6 p-0">
      {/* {meta.status === 'live' &&
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
        ))} */}

      {meta.status === 'ended' && <EndScreen sessionId={sessionId} />}

      {meta.status === 'live' && phase && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            {/* <p className="text-xs text-gray-500">Now playing: {phase.id}</p> */}
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

// Pre-live host lobby view: "Host" pill, title, three-stat row (screens / teams
// / code), teams-or-players list, big Start button. Copy button on the code
// tile opens a modal offering the two join-role links (central vs player),
// since the underlying code is the SAME string used by both routes.
function LobbyView({
  sessionId,
  joinCode,
  allowTeams,
  connectedCentrals,
  teams,
  players,
}: {
  sessionId: string
  joinCode: string
  allowTeams: boolean
  connectedCentrals: number
  teams: { id: string; teamName?: string; memberCount: number }[]
  players: [string, PlayerPresence][]
}) {
  const [copyOpen, setCopyOpen] = useState(false)

  const copyJoinLink = (role: 'central' | 'player') => {
    const url = `${window.location.origin}/join/${role}?code=${joinCode}`
    void navigator.clipboard?.writeText(url)
    toast.success(role === 'central' ? 'Link Central disalin' : 'Link Player disalin')
    setCopyOpen(false)
  }

  const totalUnits = allowTeams ? teams.length : players.length
  const unitsLabel = allowTeams ? 'Total Tim' : 'Total Pemain'

  return (
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

      <div className="mx-auto rounded-full bg-[#1C1C1E] px-6 py-2 text-sm font-semibold text-[#FFB800]">
        Host
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Panel Kontrol Host</h1>
        <p className="mx-auto mt-2 max-w-md text-xs text-white/70 sm:text-sm">
          Permainan dapat dimulai setelah pemain dan perangkat utama bergabung
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/5 bg-[#121212] p-3 sm:p-4">
        <StatTile label="Layar Utama" value={String(connectedCentrals)} />
        <StatTile label={unitsLabel} value={String(totalUnits)} />
        <StatTile label="Kode Sesi" value={joinCode} onCopy={() => setCopyOpen(true)} />
      </div>

      <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-white/5 bg-[#121212] p-4 sm:p-6">
        <div className="text-sm font-semibold text-white sm:text-base">
          {allowTeams ? 'Tim Terhubung' : 'Pemain Terhubung'}
        </div>
        {allowTeams ? (
          <TeamList players={players} teams={teams} />
        ) : players.length === 0 ? (
          <p className="px-1 text-xs text-white/50">Belum ada pemain yang bergabung.</p>
        ) : (
          <PlayerRows players={players} />
        )}
      </div>

      <button
        type="button"
        onClick={() => startSession(sessionId)}
        className="w-full rounded-lg bg-[#FFB800] py-4 text-center text-base font-bold text-black sm:rounded-lg sm:py-[18px] sm:text-lg"
      >
        Mulai Permainan
      </button>

      {copyOpen && <CopyCodeModal onDismiss={() => setCopyOpen(false)} onCopy={copyJoinLink} />}
    </div>
  )
}

function StatTile({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/5 bg-[#0A0A0A] p-3 sm:p-4">
      <span className="text-xs text-[#FFB800] sm:text-sm">{label}</span>
      <span className="flex items-center gap-2 text-lg font-bold text-white sm:text-2xl">
        {value}
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="text-yellow-300 hover:text-yellow-400"
            aria-label={`Salin ${label}`}
          >
            <Icon icon="mdi:content-copy" className="size-4" />
          </button>
        )}
      </span>
    </div>
  )
}

function CopyCodeModal({
  onDismiss,
  onCopy,
}: {
  onDismiss: () => void
  onCopy: (role: 'central' | 'player') => void
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-white/10 bg-[#121212] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center text-lg font-bold text-white">Salin Kode</h2>
        <p className="text-center text-xs text-white/60">Pilih tautan mana yang ingin disalin.</p>
        <button
          type="button"
          onClick={() => onCopy('central')}
          className="w-full rounded-lg bg-[#FFB800] py-3 text-sm font-bold text-black"
        >
          Central screen code
        </button>
        <button
          type="button"
          onClick={() => onCopy('player')}
          className="w-full rounded-lg bg-[#FFB800] py-3 text-sm font-bold text-black"
        >
          Player code
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full rounded-lg py-2 text-sm text-white/60 hover:text-white"
        >
          Batal
        </button>
      </div>
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
