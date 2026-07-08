import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import { PhaseRouter } from '@/phases/PhaseRouter'

import { joinPresence } from '@/session/presence'

import { usePhasePointer } from '@/sync/usePhasePointer'
import { useSessionMeta } from '@/sync/useSession'

import { demoBundle } from '@/lib/demoBundle'
import { loadIdentity, saveIdentity } from '@/lib/identity'
import { newId } from '@/lib/ids'

type Identity = { id: string; name?: string; isNew: boolean }

export function PlayerView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [sp] = useSearchParams()
  const meta = useSessionMeta(sessionId)
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

  useEffect(() => {
    if (!sessionId) return
    return joinPresence(sessionId, 'player', identity.id, {
      isNew: identity.isNew,
      name: identity.name,
    })
  }, [sessionId, identity])

  const phase = pointer ? demoBundle.phases[pointer.activePhaseId] : null

  return (
    <div className="flex min-h-screen flex-col gap-4 p-8">
      <p className="text-xs text-gray-500">
        {sessionId} · {meta?.status ?? '—'} · {identity.name ?? identity.id}
      </p>
      {phase && sessionId ? (
        <PhaseRouter phase={phase} role="player" sessionId={sessionId} playerId={identity.id} />
      ) : (
        <p className="text-sm text-gray-500">Waiting for host…</p>
      )}
    </div>
  )
}
