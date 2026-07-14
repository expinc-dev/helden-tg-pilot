import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import { EndScreen } from '@/pages/extra/end-screen'

import { PhaseRouter } from '@/phases/PhaseRouter'
import { TimerBar } from '@/phases/TimerBar'

import { demoBundle } from '@/lib/demoBundle'
import { saveLastSession } from '@/lib/identity'
import { joinPresence } from '@/lib/session/presence'
import { joinTeam } from '@/lib/session/teams'
import { usePhasePointer } from '@/lib/sync/usePhasePointer'
import { useSessionConfig, useSessionMeta } from '@/lib/sync/useSession'
import { useMyTeamId, useTeams } from '@/lib/sync/useTeams'

import { PlayerWaitingScreen } from './components/PlayerWaitingScreen'
import { TeamLeaderWaitingScreen } from './components/TeamLeaderWaitingScreen'
import { TeamLobby } from './components/TeamLobby'
import { useResolvedIdentity } from './logic/useIdentity'

export function PlayerView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [sp] = useSearchParams()
  const meta = useSessionMeta(sessionId)
  const config = useSessionConfig(sessionId)
  const pointer = usePhasePointer(sessionId)

  const typedName = sp.get('name') ?? undefined
  const identity = useResolvedIdentity(sessionId, typedName)

  // Remember "this is the session I'm in" so JoinGate can offer Rejoin instantly,
  // before anyone types a code — separate from the identity itself.
  useEffect(() => {
    if (sessionId) saveLastSession('player', sessionId)
  }, [sessionId])

  const [full, setFull] = useState(false)
  const [teamJoinFailed, setTeamJoinFailed] = useState(false)
  const myTeamId = useMyTeamId(sessionId, identity?.id ?? '')
  const teams = useTeams(sessionId)
  const myTeam = teams.find((t) => t.id === myTeamId)
  const teamParam = sp.get('team') ?? undefined
  // Arrived via an invite QR and the join hasn't resolved yet → block the picker
  // so the ~1-2s async window can't be used to tap a different team.
  const joiningViaInvite = !!teamParam && !myTeamId && !teamJoinFailed

  useEffect(() => {
    if (!sessionId || !identity) return
    let leave = () => {}
    let cancelled = false
    joinPresence(sessionId, 'player', identity.id, {
      isNew: identity.isNew,
      name: identity.name,
    }).then(async (r) => {
      if (!r.ok) {
        if (!cancelled) setFull(true)
        return
      }
      if (cancelled) {
        // StrictMode remount: mount2 has already re-joined against the same
        // presence node. Firing r.leave() here would racily overwrite mount2's
        // connected:true with connected:false, leaving the host permanently at
        // 0/N. Firebase onDisconnect handles real tab-close; skip manual leave.
        return
      }
      leave = r.leave
      // Bind to the scanned team AFTER presence is written, so joinTeam's
      // teamId update isn't clobbered by the presence set (they used to race).
      if (teamParam) {
        const tr = await joinTeam(sessionId, identity.id, teamParam)
        if (!tr.ok && !cancelled) setTeamJoinFailed(true) // full/gone → drop to picker
      }
    })
    return () => {
      cancelled = true
      leave()
    }
  }, [sessionId, teamParam, identity])

  const phase = pointer ? demoBundle.phases[pointer.activePhaseId] : null

  if (!identity) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-sm text-gray-500">Joining…</p>
      </div>
    )
  }

  if (full) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-sm text-red-600">Session is full — can’t join as player.</p>
      </div>
    )
  }

  // Joining via invite QR: hold a blocking screen until membership resolves, so
  // the picker never flashes and can't be used to join a different team.
  if (config?.allowTeams && !phase && joiningViaInvite && sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-sm text-gray-500">Joining team…</p>
      </div>
    )
  }

  // Team Mode lobby: before the host starts, pick/create a team (unless the QR
  // already bound one). Skipped entirely when allowTeams is off.
  if (config?.allowTeams && !phase && !myTeamId && sessionId) {
    return (
      <TeamLobby
        sessionId={sessionId}
        playerId={identity.id}
        notice={teamJoinFailed ? 'That team is full — pick another.' : undefined}
      />
    )
  }

  if (meta?.status === 'ended' && sessionId) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-8">
        <p className="text-xs text-gray-500">
          {sessionId} · {meta.status} · {identity.name ?? identity.id}
        </p>
        <EndScreen sessionId={sessionId} />
      </div>
    )
  }

  if (phase && sessionId) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-8">
        <p className="text-xs text-gray-500">
          {sessionId} · {meta?.status ?? '—'} · {identity.name ?? identity.id}
        </p>
        <TimerBar sessionId={sessionId} phase={phase} role="player" />
        <PhaseRouter
          phase={phase}
          phaseStartMs={pointer?.changedAt}
          role="player"
          sessionId={sessionId}
          playerId={identity.id}
          allowTeams={config?.allowTeams}
          teamId={myTeamId}
        />
      </div>
    )
  }

  const isTeamLeader =
    config?.allowTeams && myTeamId && myTeam && myTeam.ownerPlayerId === identity.id
  if (isTeamLeader && sessionId && config?.joinCode) {
    return (
      <TeamLeaderWaitingScreen
        sessionId={sessionId}
        joinCode={config.joinCode}
        teamId={myTeamId}
        teamName={myTeam.teamName ?? 'Anda'}
        memberIds={Object.keys(myTeam.memberIds)}
      />
    )
  }

  const teamName = config?.allowTeams && myTeamId ? (myTeam?.teamName ?? 'Anda') : undefined
  return <PlayerWaitingScreen teamName={teamName} />
}
