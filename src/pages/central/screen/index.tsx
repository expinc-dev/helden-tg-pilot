import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { EndScreen } from '@/pages/extra/end-screen'

import { PhaseRouter } from '@/phases/PhaseRouter'
import { TimerBar } from '@/phases/TimerBar'

import { demoBundle } from '@/lib/demoBundle'
import { loadIdentity, saveIdentity, saveLastSession } from '@/lib/identity'
import { newId } from '@/lib/ids'
import { joinPresence } from '@/lib/session/presence'
import { usePhasePointer } from '@/lib/sync/usePhasePointer'
import { useSessionConfig, useSessionMeta } from '@/lib/sync/useSession'

import { WaitingScreen } from './WaitingScreen'

type Identity = { id: string; isNew: boolean }

export function CentralView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const meta = useSessionMeta(sessionId)
  const config = useSessionConfig(sessionId)
  const pointer = usePhasePointer(sessionId)

  const [identity] = useState<Identity>(() => {
    const stored = sessionId ? loadIdentity(sessionId, 'central') : null
    if (stored) return { id: stored.id, isNew: false }
    const id = newId('c')
    if (sessionId) saveIdentity(sessionId, 'central', { id })
    return { id, isNew: true }
  })

  // Remember "this is the session I'm in" so JoinGate can offer Rejoin instantly,
  // before anyone types a code — separate from the identity itself.
  useEffect(() => {
    if (sessionId) saveLastSession('central', sessionId)
  }, [sessionId])

  const [full, setFull] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    let leave = () => {}
    let cancelled = false
    joinPresence(sessionId, 'central', identity.id, { isNew: identity.isNew }).then((r) => {
      if (r.ok) {
        // StrictMode remount: skip leave() when cancelled — mount2 has already
        // written connected:true, and firing update({connected:false}) here would
        // race-overwrite it, stranding the host at 0/N. onDisconnect handles the
        // real tab-close case.
        if (!cancelled) leave = r.leave
      } else if (!cancelled) setFull(true)
    })
    return () => {
      cancelled = true
      leave()
    }
  }, [sessionId, identity])

  const phase = pointer ? demoBundle.phases[pointer.activePhaseId] : null

  if (full) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-sm text-red-600">Session is full — no central-screen slots left.</p>
      </div>
    )
  }

  if (meta?.status === 'ended' && sessionId) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-8">
        <p className="text-xs text-gray-500">
          {sessionId} · {meta.status} · {identity.id}
        </p>
        <EndScreen sessionId={sessionId} />
      </div>
    )
  }

  // Idle's full-bleed lobby-style layout escapes the standard live wrapper's
  // padding and debug line — same reasoning as the host's video bypass.
  if (phase && sessionId && phase.content.type === 'idle') {
    return (
      <PhaseRouter
        phase={phase}
        phaseStartMs={pointer?.changedAt}
        role="central"
        sessionId={sessionId}
        allowTeams={config?.allowTeams}
      />
    )
  }

  if (phase && sessionId) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-8">
        <p className="text-xs text-gray-500">
          {sessionId} · {meta?.status ?? '—'} · {identity.id}
        </p>
        <TimerBar sessionId={sessionId} phase={phase} role="central" />
        <PhaseRouter
          phase={phase}
          phaseStartMs={pointer?.changedAt}
          role="central"
          sessionId={sessionId}
          allowTeams={config?.allowTeams}
        />
      </div>
    )
  }

  return <WaitingScreen sessionId={sessionId} joinCode={config?.joinCode} />
}
