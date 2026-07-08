import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { PhaseRouter } from '@/phases/PhaseRouter'

import { joinPresence } from '@/session/presence'

import { usePhasePointer } from '@/sync/usePhasePointer'
import { useSessionMeta } from '@/sync/useSession'

import { demoBundle } from '@/lib/demoBundle'
import { loadIdentity, saveIdentity } from '@/lib/identity'
import { newId } from '@/lib/ids'

type Identity = { id: string; isNew: boolean }

export function CentralView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const meta = useSessionMeta(sessionId)
  const pointer = usePhasePointer(sessionId)

  const [identity] = useState<Identity>(() => {
    const stored = sessionId ? loadIdentity(sessionId, 'central') : null
    if (stored) return { id: stored.id, isNew: false }
    const id = newId('c')
    if (sessionId) saveIdentity(sessionId, 'central', { id })
    return { id, isNew: true }
  })

  useEffect(() => {
    if (!sessionId) return
    return joinPresence(sessionId, 'central', identity.id, { isNew: identity.isNew })
  }, [sessionId, identity])

  const phase = pointer ? demoBundle.phases[pointer.activePhaseId] : null

  return (
    <div className="flex min-h-screen flex-col gap-4 p-8">
      <p className="text-xs text-gray-500">
        {sessionId} · {meta?.status ?? '—'} · {identity.id}
      </p>
      {phase && sessionId ? (
        <PhaseRouter phase={phase} role="central" sessionId={sessionId} />
      ) : (
        <p className="text-sm text-gray-500">Waiting for host…</p>
      )}
    </div>
  )
}
