import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

import { PhaseRouter } from '@/phases/PhaseRouter'
import { TimerBar } from '@/phases/TimerBar'

import { EndScreen } from '@/session/EndScreen'
import { nextPhase, startSession } from '@/session/control'

import { usePhasePointer } from '@/sync/usePhasePointer'
import { usePresenceCounts, useSessionConfig, useSessionMeta } from '@/sync/useSession'
import { useTimer } from '@/sync/useTimer'

import { demoBundle } from '@/lib/demoBundle'

export function HostView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const meta = useSessionMeta(sessionId)
  const config = useSessionConfig(sessionId)
  const pointer = usePhasePointer(sessionId)
  const { players, centrals } = usePresenceCounts(sessionId)

  const phase = pointer ? demoBundle.phases[pointer.activePhaseId] : null
  const timer = useTimer(sessionId, phase)

  // Auto-advance is host-only: the host owns the phase pointer, so it alone acts
  // on expiry (other devices just show "Time's up"). Guard so it fires once per phase.
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
      void nextPhase(sessionId, phase.id)
    }
  }, [sessionId, phase, timer.active, timer.expired, pointer?.activePhaseId])

  if (!meta || !config || !sessionId) {
    return <div className="p-8 text-sm text-gray-500">Loading session {sessionId}…</div>
  }

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
        {meta.status === 'live' &&
          (() => {
            const order = demoBundle.phaseOrder
            const isLast =
              !!pointer?.activePhaseId && order.indexOf(pointer.activePhaseId) === order.length - 1
            return (
              <button
                onClick={() => nextPhase(sessionId, pointer?.activePhaseId)}
                className="rounded border px-4 py-2"
              >
                {isLast ? 'End session' : 'Next phase'}
              </button>
            )
          })()}
      </div>

      {meta.status === 'ended' && <EndScreen sessionId={sessionId} />}

      {meta.status === 'live' && phase && (
        <div className="rounded border p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">Now playing: {phase.id}</p>
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
    </div>
  )
}
