import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { PhaseRouter } from '@/phases/PhaseRouter'
import { TimerBar } from '@/phases/TimerBar'

import { joinPresence } from '@/session/presence'

import { usePhasePointer } from '@/sync/usePhasePointer'
import { useSessionConfig, useSessionMeta } from '@/sync/useSession'

import { demoBundle } from '@/lib/demoBundle'
import { loadIdentity, saveIdentity } from '@/lib/identity'
import { newId } from '@/lib/ids'

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

  const [full, setFull] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    let leave = () => {}
    let cancelled = false
    joinPresence(sessionId, 'central', identity.id, { isNew: identity.isNew }).then((r) => {
      if (r.ok) {
        if (cancelled) r.leave()
        else leave = r.leave
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

  return (
    <div className="flex min-h-screen flex-col gap-4 p-8">
      <p className="text-xs text-gray-500">
        {sessionId} · {meta?.status ?? '—'} · {identity.id}
      </p>
      {phase && sessionId ? (
        <>
          <TimerBar sessionId={sessionId} phase={phase} role="central" />
          <PhaseRouter
            phase={phase}
            role="central"
            sessionId={sessionId}
            allowTeams={config?.allowTeams}
          />
        </>
      ) : (
        <p className="text-sm text-gray-500">Waiting for host…</p>
      )}
    </div>
  )
}
