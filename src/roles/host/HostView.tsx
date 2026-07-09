import { useParams } from 'react-router-dom'

import { PhaseRouter } from '@/phases/PhaseRouter'

import { nextPhase, startSession } from '@/session/control'

import { usePhasePointer } from '@/sync/usePhasePointer'
import { usePresenceCounts, useSessionConfig, useSessionMeta } from '@/sync/useSession'

import { demoBundle } from '@/lib/demoBundle'

export function HostView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const meta = useSessionMeta(sessionId)
  const config = useSessionConfig(sessionId)
  const pointer = usePhasePointer(sessionId)
  const { players, centrals } = usePresenceCounts(sessionId)

  if (!meta || !config || !sessionId) {
    return <div className="p-8 text-sm text-gray-500">Loading session {sessionId}…</div>
  }

  const phase = pointer ? demoBundle.phases[pointer.activePhaseId] : null

  return (
    <div className="flex min-h-screen flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">Host — {meta.status}</h1>
        <p className="text-xs text-gray-500">{sessionId}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Join code</p>
        <p className="font-mono text-4xl tracking-widest">{config.joinCode}</p>
      </div>
      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-gray-500">Players: </span>
          {players}/{config.maxPlayers}
        </div>
        <div>
          <span className="text-gray-500">Central: </span>
          {centrals}/{config.maxCentralScreens}
        </div>
      </div>

      <div className="flex gap-2">
        {meta.status === 'lobby' && (
          <button
            onClick={() => startSession(sessionId)}
            className="rounded bg-black px-4 py-2 text-white"
          >
            Start session
          </button>
        )}
        {meta.status === 'live' && (
          <button
            onClick={() => nextPhase(sessionId, pointer?.activePhaseId)}
            className="rounded border px-4 py-2"
          >
            Next phase
          </button>
        )}
      </div>

      {phase && (
        <div className="rounded border p-4">
          <p className="mb-2 text-xs text-gray-500">Now playing: {phase.id}</p>
          <PhaseRouter
            phase={phase}
            role="host"
            sessionId={sessionId}
            allowTeams={config.allowTeams}
          />
        </div>
      )}
    </div>
  )
}
