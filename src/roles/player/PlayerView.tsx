import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import { PhaseRouter } from '@/phases/PhaseRouter'

import { joinPresence } from '@/session/presence'
import { joinTeam } from '@/session/teams'

import { usePhasePointer } from '@/sync/usePhasePointer'
import { useSessionConfig, useSessionMeta } from '@/sync/useSession'
import { useMyTeamId } from '@/sync/useTeams'

import { demoBundle } from '@/lib/demoBundle'
import { loadIdentity, saveIdentity } from '@/lib/identity'
import { newId } from '@/lib/ids'

import { TeamLobby } from './TeamLobby'

type Identity = { id: string; name?: string; isNew: boolean }

export function PlayerView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [sp] = useSearchParams()
  const meta = useSessionMeta(sessionId)
  const config = useSessionConfig(sessionId)
  const pointer = usePhasePointer(sessionId)

  // Save-on-generate in the initializer keeps the id stable across refresh AND
  // StrictMode remount (a saved id is read back identically). isNew is best-effort.
  const [identity] = useState<Identity>(() => {
    const stored = sessionId ? loadIdentity(sessionId, 'player') : null
    if (stored) return { id: stored.id, name: stored.name, isNew: false }
    const id = newId('p')
    const name = sp.get('name') ?? undefined
    if (sessionId) saveIdentity(sessionId, 'player', { id, name })
    return { id, name, isNew: true }
  })

  const [full, setFull] = useState(false)
  const [teamJoinFailed, setTeamJoinFailed] = useState(false)
  const myTeamId = useMyTeamId(sessionId, identity.id)
  const teamParam = sp.get('team') ?? undefined
  // Arrived via an invite QR and the join hasn't resolved yet → block the picker
  // so the ~1-2s async window can't be used to tap a different team.
  const joiningViaInvite = !!teamParam && !myTeamId && !teamJoinFailed

  useEffect(() => {
    if (!sessionId) return
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
        r.leave()
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
        joinCode={config.joinCode}
        notice={teamJoinFailed ? 'That team is full — pick another.' : undefined}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 p-8">
      <p className="text-xs text-gray-500">
        {sessionId} · {meta?.status ?? '—'} · {identity.name ?? identity.id}
      </p>
      {phase && sessionId ? (
        <PhaseRouter
          phase={phase}
          role="player"
          sessionId={sessionId}
          playerId={identity.id}
          allowTeams={config?.allowTeams}
          teamId={myTeamId}
        />
      ) : config?.allowTeams && myTeamId ? (
        <TeamLobby sessionId={sessionId!} playerId={identity.id} joinCode={config.joinCode} />
      ) : (
        <p className="text-sm text-gray-500">Waiting for host…</p>
      )}
    </div>
  )
}
