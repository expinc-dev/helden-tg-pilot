import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { newId } from '@/lib/ids'
import { demoBundle } from '@/lib/demoBundle'
import { PhaseRouter } from '@/phases/PhaseRouter'
import { joinPresence } from '@/session/presence'
import { usePhasePointer } from '@/sync/usePhasePointer'
import { useSessionMeta } from '@/sync/useSession'

export function CentralView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const meta = useSessionMeta(sessionId)
  const pointer = usePhasePointer(sessionId)
  const [id] = useState(() => newId('c'))

  useEffect(() => {
    if (!sessionId) return
    return joinPresence(sessionId, 'central', id)
  }, [sessionId, id])

  const phase = pointer ? demoBundle.phases[pointer.activePhaseId] : null

  return (
    <div className="min-h-screen p-8 flex flex-col gap-4">
      <p className="text-xs text-gray-500">{sessionId} · {meta?.status ?? '—'} · {id}</p>
      {phase ? <PhaseRouter phase={phase} role="central" /> : <p className="text-sm text-gray-500">Waiting for host…</p>}
    </div>
  )
}
