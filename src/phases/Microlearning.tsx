import type { MicrolearningContent, Phase } from '@helden-inc/tg-schema'

import { resolveStepTarget } from '@/sync/teamStep'
import { usePlayerBoard, usePlayerStep } from '@/sync/usePlayerStep'
import { useTeamOwner, useTeamRole } from '@/sync/useTeamRole'
import { useMyTeamId } from '@/sync/useTeams'

import type { Role } from './PhaseRouter'

export function MicrolearningRenderer({
  content,
  title,
  role,
  sessionId,
  playerId,
  phase,
}: {
  content: MicrolearningContent
  title: string
  role: Role
  sessionId: string
  playerId?: string
  phase: Phase
}) {
  if (role === 'player' && playerId)
    return <PlayerPane content={content} sessionId={sessionId} playerId={playerId} phase={phase} />
  return <MonitorPane content={content} title={title} sessionId={sessionId} />
}

function PlayerPane({
  content,
  sessionId,
  playerId,
  phase,
}: {
  content: MicrolearningContent
  sessionId: string
  playerId: string
  phase: Phase
}) {
  // Team Mode: a team_leader_only member has no selfStep of their own — they
  // mirror the leader's. Resolved once, here, via the shared useTeamRole helper
  // (not re-derived per phase renderer) + the pure resolveStepTarget rule.
  const teamRole = useTeamRole(sessionId, playerId, phase)
  const teamId = useMyTeamId(sessionId, playerId)
  const leaderId = useTeamOwner(sessionId, teamId)
  const { targetPlayerId, canWrite } = resolveStepTarget(
    playerId,
    teamRole,
    leaderId,
    phase.teamMode
  )

  const [step, setStep] = usePlayerStep(sessionId, targetPlayerId, phase.syncMode)
  const bounded = Math.min(step, content.steps.length - 1)
  const current = content.steps[bounded]
  const isLast = bounded === content.steps.length - 1
  const text = current.blocks.find((b) => b.kind === 'text')?.markdown ?? current.id

  return (
    <div className="flex max-w-lg flex-col gap-4 p-6">
      <p className="text-xs text-gray-400">
        Step {bounded + 1}/{content.steps.length}
        {teamRole === 'member' && ' · following your team leader'}
      </p>
      <pre className="font-sans text-base whitespace-pre-wrap">{text}</pre>
      {canWrite ? (
        <button
          onClick={() => setStep(bounded + 1)}
          disabled={isLast}
          className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-40"
        >
          {isLast ? 'Done' : 'Next'}
        </button>
      ) : (
        <p className="text-xs text-gray-400">Your team leader controls Next.</p>
      )}
    </div>
  )
}

function MonitorPane({
  content,
  title,
  sessionId,
}: {
  content: MicrolearningContent
  title: string
  sessionId: string
}) {
  const rows = usePlayerBoard(sessionId)
  const total = content.steps.length
  return (
    <div className="flex flex-col gap-3 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-xs text-gray-400">
        {rows.length} player(s) · {total} steps
      </p>
      <table className="text-sm">
        <tbody>
          {rows.map((r) => {
            const done = Math.min(r.selfStep, total - 1) + 1
            return (
              <tr key={r.id} className={r.connected ? '' : 'opacity-40'}>
                <td className="pr-4">{r.name}</td>
                <td className="pr-4 font-mono text-xs text-gray-500">{r.id}</td>
                <td className="w-48">
                  <div className="h-2 rounded bg-gray-200">
                    <div
                      className="h-2 rounded bg-black"
                      style={{ width: `${(done / total) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="pl-2 text-xs text-gray-500">
                  {done}/{total}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
