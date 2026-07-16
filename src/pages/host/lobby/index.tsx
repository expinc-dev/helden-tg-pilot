import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { assets } from '@/assets'
import { Modal } from '@/components/Modal'
import { EndScreen } from '@/pages/extra/end-screen'
import { Header } from '@/pages/host/_shared/Header'
import { HostPresenceSpread } from '@/pages/host/_shared/HostPresenceSpread'
import { PickerGrid } from '@/pages/host/_shared/PickerGrid'
import { PlayerRows, StatTile, TeamList } from '@/pages/host/_shared/Roster'
import type { PlayerPresence } from '@helden-inc/tg-schema'
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

import { HostBadge } from '../_shared/HostBadge'

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
        videoTitle={phase.title}
        videoUrl={phase.content.videoUrl}
        onAdvance={advance}
      />
    )
  }

  // Idle-phase host screen — sequential flow only. Modular flow's idle phase
  // is the picker anchor and must hit onPicker below instead; endLevel is a
  // no-op when called on the idle phase itself (nothing to flush), so wiring
  // this screen up there would make its button silently do nothing.
  if (meta.status === 'live' && phase && phase.content.type === 'idle' && !isModular) {
    return (
      <PhaseRouter
        phase={phase}
        phaseStartMs={pointer?.changedAt}
        role="host"
        sessionId={sessionId}
        allowTeams={config.allowTeams}
        onAdvance={() => nextPhase(sessionId, pointer?.activePhaseId)}
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
      // 1. Ubah min-h-dvh jadi h-dvh dan hapus overflow-y-auto di sini agar halaman tidak ikut scroll
      className="flex h-dvh w-full flex-col gap-3 overflow-hidden px-8 py-3"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Header />

      {/* 2. Tambahkan flex-1 dan min-h-0 di bungkus utama panel ini */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 rounded-2xl border border-white/5 bg-[#12121299] p-4 sm:p-6">
        <HostBadge pageName="Lobby" />

        <div className="text-center">
          <h1 className="manrope-font text-2xl font-semibold text-white sm:text-3xl">
            Panel Kontrol Host
          </h1>
          <p className="manrope-font mx-auto mt-2 max-w-xl text-2xl font-light text-white/70">
            Mulai sesi setelah seluruh pemain bergabung
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/5 bg-[#121212] p-3 sm:p-4">
          <StatTile label="Layar Utama" value={String(connectedCentrals)} />
          <StatTile label={unitsLabel} value={String(totalUnits)} />
          <StatTile label="Kode Sesi" value={joinCode} onCopy={() => setCopyOpen(true)} />
        </div>

        {/* 3. Tambahkan min-h-0 dan overflow-y-auto di sini agar daftar tim bisa di-scroll secara independen */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/5 bg-[#121212] p-4 sm:p-6">
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
      </div>

      <button
        type="button"
        onClick={() => startSession(sessionId)}
        className="bg-helden-yellow-gradient mt-auto w-full shrink-0 rounded-lg py-4 text-center text-lg font-medium text-black"
      >
        Mulai Permainan
      </button>

      {copyOpen && <CopyCodeModal onDismiss={() => setCopyOpen(false)} onCopy={copyJoinLink} />}
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
    <Modal title="Salin Kode" onClose={onDismiss} dismissOnBackdrop>
      <p className="text-sm text-white/60">Pilih tautan mana yang ingin disalin.</p>
      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onCopy('central')}
          className="bg-helden-yellow-gradient w-full rounded-lg py-3 text-sm font-bold text-black"
        >
          Central screen code
        </button>
        <button
          type="button"
          onClick={() => onCopy('player')}
          className="bg-helden-yellow-gradient w-full rounded-lg py-3 text-sm font-bold text-black"
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
    </Modal>
  )
}
