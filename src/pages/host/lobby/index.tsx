import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { assets } from '@/assets'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GradientButton } from '@/components/GradientButton'
import { Modal } from '@/components/Modal'
import { EndScreen } from '@/pages/extra/end-screen'
import { Header } from '@/pages/host/_shared/Header'
import { HostNextPhaseButton } from '@/pages/host/_shared/HostNextPhaseButton'
import { HostPresenceSpread } from '@/pages/host/_shared/HostPresenceSpread'
import { HostScriptPanel } from '@/pages/host/_shared/HostScriptPanel'
import { LevelIntro } from '@/pages/host/_shared/LevelIntro'
import { PhaseStartList } from '@/pages/host/_shared/PhaseStartList'
import { PickerGrid } from '@/pages/host/_shared/PickerGrid'
import { PlayerRows, StatTile, TeamList } from '@/pages/host/_shared/Roster'
import type { PlayerPresence } from '@helden-inc/tg-schema'
import { toast } from 'sonner'

import { useCodeInputAllSolved } from '@/phases/CodeInput/lib'
import { PhaseRouter } from '@/phases/PhaseRouter'
import { VideoHostScreen } from '@/phases/Video'

import { demoBundle } from '@/lib/demoBundle'
import {
  endLevel,
  endSession,
  forceExpireTimer,
  jumpToPhase,
  nextPhase,
  startSession,
} from '@/lib/session/control'
import { useGameType } from '@/lib/sync/useGameType'
import { usePhasePointer } from '@/lib/sync/usePhasePointer'
import { usePlayedPhases } from '@/lib/sync/usePlayedPhases'
import { usePresence, useSessionConfig, useSessionMeta } from '@/lib/sync/useSession'
import { useTeams } from '@/lib/sync/useTeams'
import { type TimerState, useTimer } from '@/lib/sync/useTimer'

import { HostBadge } from '../_shared/HostBadge'

export function HostView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const meta = useSessionMeta(sessionId)
  const config = useSessionConfig(sessionId)
  const pointer = usePhasePointer(sessionId)
  const { players, centrals } = usePresence(sessionId)
  const teams = useTeams(sessionId)
  const gameType = useGameType()

  const phase = pointer ? demoBundle.phases[pointer.activePhaseId] : null
  const timer = useTimer(sessionId, phase)
  const played = usePlayedPhases(sessionId)
  const flowMode = demoBundle.flowMode ?? 'sequential'
  const isModular = flowMode === 'modular-open' || flowMode === 'modular-progressive'
  const onPicker = isModular && phase?.type === 'idle'
  // Picker → intro → play: tapping a level card stages it here instead of
  // jumping straight in, so the host gets a "brief the room" beat first.
  const [pendingPhaseId, setPendingPhaseId] = useState<string | null>(null)
  // Lobby → phase list → start. Host-local: nothing is written until the host
  // confirms the first phase.
  const [pickingPhase, setPickingPhase] = useState(false)
  const [confirmStart, setConfirmStart] = useState(false)

  // One advance per phase. Every advance path on this route — both auto-advance
  // effects below and every manual control rendered further down — funnels
  // through runAdvance, so a double tap (the video confirm is never disabled by
  // design) or a manual click landing in the same tick as an auto-advance cannot
  // fire nextPhase/endLevel twice for one phase. flushPhaseResults assumes
  // exactly that: its live aggregate map is a read-modify-write that is safe
  // only once per transition (lib/session/flush.ts:208-219). Keyed by phase id,
  // so it re-arms on the next phase with no explicit reset.
  const advanceLockRef = useRef<string | null>(null)
  const runAdvance = useCallback((phaseId: string | undefined, fn: () => Promise<unknown>) => {
    if (!phaseId || advanceLockRef.current === phaseId) return
    advanceLockRef.current = phaseId
    // Re-arm on failure, otherwise a single RTDB error would leave the host
    // unable to advance off this phase at all.
    void fn().catch((e) => {
      advanceLockRef.current = null
      console.error('advance failed for', phaseId, e)
    })
  }, [])

  useEffect(() => {
    if (!sessionId || !phase) return
    if (
      timer.active &&
      timer.expired &&
      phase.timer?.autoAdvanceOnExpire &&
      pointer?.activePhaseId === phase.id
    ) {
      // Modular: timer-expiry auto-advance means "end this level → back to picker",
      // not "next phase in order". Sequence: original nextPhase behaviour.
      runAdvance(phase.id, () =>
        isModular ? endLevel(sessionId, phase.id) : nextPhase(sessionId, phase.id)
      )
    }
  }, [sessionId, phase, timer.active, timer.expired, pointer?.activePhaseId, isModular, runAdvance])

  // codeinput's onSuccess.advance — shares runAdvance's per-phase lock with the
  // timer effect above, so the two auto-advance triggers cannot race each other
  // into double-advancing the same phase.
  const teamIds = teams.map((t) => t.id)
  const codeInputAllSolved = useCodeInputAllSolved(sessionId, phase, teamIds, !!config?.allowTeams)
  useEffect(() => {
    if (!sessionId || !phase) return
    if (codeInputAllSolved && pointer?.activePhaseId === phase.id) {
      runAdvance(phase.id, () =>
        isModular ? endLevel(sessionId, phase.id) : nextPhase(sessionId, phase.id)
      )
    }
  }, [sessionId, phase, codeInputAllSolved, pointer?.activePhaseId, isModular, runAdvance])

  if (!meta || !config || !sessionId) {
    return <div className="p-8 text-sm text-gray-500">Memuat sesi {sessionId}…</div>
  }

  const playerEntries = Object.entries(players) as [string, PlayerPresence][]
  const centralEntries = Object.entries(centrals) as [string, { connected: boolean }][]
  const connectedCentrals = centralEntries.filter(([, c]) => c.connected).length

  if (meta.status === 'lobby' && pickingPhase) {
    return (
      <>
        <PhaseStartList
          bundle={demoBundle}
          onStart={() => setConfirmStart(true)}
          onBack={() => setPickingPhase(false)}
        />
        {confirmStart && (
          <ConfirmDialog
            title="Mulai permainan?"
            message="Setelah dimulai, pemain yang belum bergabung tidak bisa masuk lagi. Yakin ingin memulai sekarang?"
            confirmLabel="Ya, mulai"
            cancelLabel="Kembali"
            onCancel={() => setConfirmStart(false)}
            onConfirm={() => {
              setConfirmStart(false)
              void startSession(sessionId)
            }}
          />
        )}
      </>
    )
  }

  if (meta.status === 'lobby') {
    return (
      <LobbyView
        onProceed={() => setPickingPhase(true)}
        joinCode={config.joinCode}
        allowTeams={!!config.allowTeams}
        connectedCentrals={connectedCentrals}
        teams={teams}
        players={playerEntries}
      />
    )
  }

  // Host script overlay (HLN-001). Mounted in every branch that is actually
  // running a phase, because each live branch below returns early with its own
  // full-bleed layout — a panel added only to the shared shell at the bottom of
  // this function would be silently skipped by video, idle and microlearning.
  // Lobby and the modular picker are deliberately exempt: no phase is running
  // yet, so there is no anchor script to read. Deliberately unkeyed: every
  // caller's wrapper carries `key={phase.id}` and remounts its whole subtree —
  // panel included — which is what re-seeds the panel's open state from the new
  // phase's improvMarker. A key here would duplicate the key of the phase child
  // in the same branch and push React onto its key-map path, where the duplicate
  // is neither matched nor deleted: that is how the stale phase card stayed
  // mounted beside the new one.
  const scriptPanel = <HostScriptPanel phase={phase} />

  // Video-phase host screen: rendered top-level so its full-bleed layout
  // escapes the standard live wrapper's padding (which would otherwise leak
  // the parent background as a white bar on TabletFrame simulations). The
  // bottom yellow button advances the phase — endLevel in modular flow,
  // nextPhase in sequential.
  if (meta.status === 'live' && phase && phase.content.type === 'video') {
    return (
      // `relative` + the frame height: HostScriptPanel is absolute, so it needs
      // this wrapper to be its containing block — these branches bypass the
      // padded live shell, which is the only other relative ancestor.
      <div
        key={phase.id}
        data-host-phase={phase.id}
        className="relative flex h-dvh w-full flex-col lg:h-full"
      >
        <VideoHostScreen
          sessionId={sessionId}
          videoTitle={phase.title}
          videoUrl={phase.content.videoUrl}
          onAdvance={() =>
            runAdvance(phase.id, () =>
              isModular
                ? endLevel(sessionId, phase.id)
                : nextPhase(sessionId, pointer?.activePhaseId)
            )
          }
        />
        {scriptPanel}
      </div>
    )
  }

  // Idle-phase host screen — sequential flow only. Modular flow's idle phase
  // is the picker anchor and must hit onPicker below instead; endLevel is a
  // no-op when called on the idle phase itself (nothing to flush), so wiring
  // this screen up there would make its button silently do nothing.
  if (meta.status === 'live' && phase && phase.content.type === 'idle' && !isModular) {
    return (
      // `relative` + the frame height: HostScriptPanel is absolute, so it needs
      // this wrapper to be its containing block — these branches bypass the
      // padded live shell, which is the only other relative ancestor.
      <div
        key={phase.id}
        data-host-phase={phase.id}
        className="relative flex h-dvh w-full flex-col lg:h-full"
      >
        <PhaseRouter
          phase={phase}
          phaseStartMs={pointer?.changedAt}
          role="host"
          sessionId={sessionId}
          allowTeams={config.allowTeams}
          onAdvance={() => runAdvance(phase.id, () => nextPhase(sessionId, pointer?.activePhaseId))}
        />
        {scriptPanel}
      </div>
    )
  }

  // Microlearning-phase host screen: rendered top-level (bypassing the padded
  // live wrapper below) for the same reason as video/idle — its own full-bleed
  // background+card layout would otherwise nest awkwardly inside that wrapper.
  // MonitorPane already renders a richer per-team/per-player progress spread
  // than the generic HostPresenceSpread panel, plus its own "Akhiri Level"
  // button inside the card, so this bypasses both.
  if (meta.status === 'live' && phase && phase.content.type === 'microlearning') {
    return (
      // `relative` + the frame height: HostScriptPanel is absolute, so it needs
      // this wrapper to be its containing block — these branches bypass the
      // padded live shell, which is the only other relative ancestor.
      <div
        key={phase.id}
        data-host-phase={phase.id}
        className="relative flex h-dvh w-full flex-col lg:h-full"
      >
        <PhaseRouter
          phase={phase}
          phaseStartMs={pointer?.changedAt}
          role="host"
          sessionId={sessionId}
          allowTeams={config.allowTeams}
          onAdvance={() =>
            runAdvance(phase.id, () =>
              isModular
                ? endLevel(sessionId, phase.id)
                : nextPhase(sessionId, pointer?.activePhaseId)
            )
          }
        />
        {scriptPanel}
      </div>
    )
  }

  // Live: modular → picker (when at idle) or phase render + End level.
  //       sequence → original Next phase button.
  if (meta.status === 'live' && onPicker) {
    const pendingPhase = pendingPhaseId ? demoBundle.phases[pendingPhaseId] : null
    if (pendingPhase) {
      return (
        <LevelIntro
          phase={pendingPhase}
          level={levelNumberFor(pendingPhase.id)}
          gameType={gameType}
          onStart={() => {
            void jumpToPhase(sessionId, pendingPhase.id)
            setPendingPhaseId(null)
          }}
        />
      )
    }
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
          onPick={(phaseId) => setPendingPhaseId(phaseId)}
          onEndSession={() => endSession(sessionId)}
        />
      </div>
    )
  }
  const phaseOrder = demoBundle.phaseOrder
  const isLastPhase =
    !!pointer?.activePhaseId && phaseOrder.indexOf(pointer.activePhaseId) === phaseOrder.length - 1

  return (
    <div
      data-host-phase={phase?.id ?? 'none'}
      // h-dvh + overflow-hidden (not min-h-dvh) so this shell never grows
      // taller than the visible frame — at lg+ TabletFrame caps the real
      // viewport into a fixed ~1024px box, and min-h-dvh would size against
      // the raw (often taller) browser viewport instead, pushing anything
      // pinned to the bottom (e.g. the quiz's per-stage action button) below
      // the visible area. lg:h-full matches that capped box exactly.
      className="relative flex h-dvh w-full flex-col gap-10 overflow-hidden px-[47px] pt-[48px] pb-[45px] lg:h-full"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute top-[10px] right-[10px] z-10">
        <Header />
      </div>

      {meta.status === 'ended' && <EndScreen sessionId={sessionId} />}

      {/* Quiz renders its own card + action button (Figma: card, 40px gap,
          64px button), so it sits directly in the shell. Every other phase
          gets the shared glass card here. */}
      {meta.status === 'live' && phase && phase.content.type === 'quiz' && (
        <PhaseRouter
          key={phase.id}
          phase={phase}
          phaseStartMs={pointer?.changedAt}
          role="host"
          sessionId={sessionId}
          allowTeams={config.allowTeams}
          onAdvance={() =>
            runAdvance(phase.id, () =>
              isModular ? endLevel(sessionId, phase.id) : nextPhase(sessionId, phase.id)
            )
          }
        />
      )}

      {meta.status === 'live' && phase && phase.content.type !== 'quiz' && (
        <div
          className={`relative flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 overflow-hidden ${
            // The presentation card carries its own 0.5px frame (Figma H10).
            phase.content.type === 'presentation'
              ? 'border-[0.5px] border-[#99a3ae]'
              : 'rounded-2xl border border-[#353535] bg-[rgba(8,8,8,0.2)]'
          }`}
        >
          <PhaseRouter
            key={phase.id}
            phase={phase}
            phaseStartMs={pointer?.changedAt}
            role="host"
            sessionId={sessionId}
            allowTeams={config.allowTeams}
            onAdvance={() =>
              runAdvance(phase.id, () =>
                isModular ? endLevel(sessionId, phase.id) : nextPhase(sessionId, phase.id)
              )
            }
          />
        </div>
      )}

      {meta.status === 'live' && phase && (
        <HostPresenceSpread sessionId={sessionId} phase={phase} players={players} />
      )}

      {/* Quiz owns the single bottom button (its own step controls, then
          "Tahap Selanjutnya" at the end) — the shell must not add a second one. */}
      {meta.status === 'live' &&
        phase &&
        phase.content.type !== 'quiz' &&
        (isModular ? (
          phase.content.type === 'minigame' ? (
            <MinigameHostAction
              sessionId={sessionId}
              timer={timer}
              onEndLevel={() => runAdvance(phase.id, () => endLevel(sessionId, phase.id))}
            />
          ) : (
            <button
              onClick={() => runAdvance(phase.id, () => endLevel(sessionId, phase.id))}
              className="w-full rounded-lg border border-white/10 py-3 text-sm font-semibold text-white/70 hover:text-white"
            >
              Akhiri Level
            </button>
          )
        ) : (
          <HostNextPhaseButton
            isLast={isLastPhase}
            onConfirm={() =>
              runAdvance(pointer?.activePhaseId, () => nextPhase(sessionId, pointer?.activePhaseId))
            }
          />
        ))}

      {/* Rendered as a direct child of this `relative` shell: the panel positions
          itself with `absolute` against it. No intermediate wrapper here — an
          overlay wrapper would have to be pointer-events-none to keep the shell
          clickable (the panel overlays the phase card), and that inheritance
          silently disabled the whole panel, toggle included. */}
      {scriptPanel}
    </div>
  )
}

// Matches PickerGrid's own numbering: 1-indexed position among non-idle
// phases in phaseOrder (idle is the picker anchor, never a card/level itself).
function levelNumberFor(phaseId: string): number {
  const nonIdle = demoBundle.phaseOrder.filter((id) => demoBundle.phases[id]?.type !== 'idle')
  return nonIdle.indexOf(phaseId) + 1
}

// Minigame phases occupy the page's bottom action slot with a button that
// changes meaning over the round's lifetime, rather than a static "Akhiri
// Level": SortOrder's reveal gate is literally `timer.expired` (see
// Minigames/SortOrder/lib.ts's isRevealReady) — reading the SAME timer
// subscription HostView already holds keeps this generic across whatever
// future minigame templates share that timer-driven reveal convention,
// without importing any one template's own hooks into this page shell.
function MinigameHostAction({
  sessionId,
  timer,
  onEndLevel,
}: {
  sessionId: string
  timer: TimerState
  onEndLevel: () => void
}) {
  const [confirmReveal, setConfirmReveal] = useState(false)

  if (!timer.active || timer.expired) {
    return (
      <button
        onClick={onEndLevel}
        className="w-full rounded-lg border border-white/10 py-3 text-sm font-semibold text-white/70 hover:text-white"
      >
        Akhiri Level
      </button>
    )
  }

  return (
    <>
      <GradientButton onClick={() => setConfirmReveal(true)} className="w-full py-4 text-base">
        Perlihatkan Skor
      </GradientButton>
      {confirmReveal && (
        <ConfirmDialog
          title="Perlihatkan skor?"
          message="Waktu level masih panjang, apakah kamu yakin memperlihatkan skor sekarang?"
          confirmLabel="Perlihatkan"
          cancelLabel="Kembali"
          onCancel={() => setConfirmReveal(false)}
          onConfirm={() => {
            setConfirmReveal(false)
            void forceExpireTimer(sessionId)
          }}
        />
      )}
    </>
  )
}

// Pre-live host lobby view: "Host" pill, title, three-stat row (screens / teams
// / code), teams-or-players list, big Start button. Copy button on the code
// tile opens a modal offering the two join-role links (central vs player),
// since the underlying code is the SAME string used by both routes.
function LobbyView({
  onProceed,
  joinCode,
  allowTeams,
  connectedCentrals,
  teams,
  players,
}: {
  onProceed: () => void
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

  // Connected players only — the same rule central's waiting screen uses
  // (usePresenceCounts), so both screens always show the same number.
  const totalUnits = allowTeams ? teams.length : players.filter(([, p]) => p.connected).length
  const unitsLabel = allowTeams ? 'Total Tim' : 'Total Pemain'
  const gameType = useGameType()

  return (
    <div
      // 1. Ubah min-h-dvh jadi h-dvh dan hapus overflow-y-auto di sini agar halaman tidak ikut scroll
      className="flex h-dvh w-full flex-col gap-10 overflow-hidden px-[47px] pt-[48px] pb-[45px]"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.auth})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Header />

      {/* 2. Tambahkan flex-1 dan min-h-0 di bungkus utama panel ini */}
      <div className="flex min-h-0 flex-1 flex-col gap-16 rounded-2xl border border-[#353535] bg-[rgba(8,8,8,0.2)] px-8 pt-10 pb-8">
        <div className="flex flex-col items-center gap-12">
          <HostBadge pageName={gameType} />

          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-[32px] leading-normal font-bold tracking-[-0.04em] text-[#d9d9d9]">
              Panel Kontrol Host
            </h1>
            <p className="text-2xl leading-[23px] font-light tracking-[-0.04em] text-[#ccc]">
              Mulai sesi setelah seluruh pemain bergabung
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex gap-4 rounded-lg border border-[#353535] bg-black/[0.08] p-6">
            <StatTile label="Layar Utama" value={String(connectedCentrals)} />
            <StatTile label={unitsLabel} value={String(totalUnits)} />
            <StatTile label="Kode Sesi" value={joinCode} onCopy={() => setCopyOpen(true)} />
          </div>

          {/* min-h-0 + overflow-y-auto: the roster scrolls on its own, the page does not. */}
          <div className="flex min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#353535_transparent] flex-col gap-8 overflow-y-auto rounded-lg border border-[#353535] bg-black/[0.08] p-6">
            <div className="text-base tracking-[-0.04em] text-white [text-shadow:0_0_12px_rgba(253,164,0,0.2)]">
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
      </div>

      <button
        type="button"
        onClick={onProceed}
        className="bg-helden-yellow-gradient h-16 w-full shrink-0 rounded-lg px-8 text-center text-lg font-medium tracking-[-0.04em] text-black"
      >
        Pilih Phase
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
