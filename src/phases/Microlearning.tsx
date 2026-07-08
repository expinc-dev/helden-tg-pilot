import type { MicrolearningContent, Phase } from '@helden-inc/tg-schema'

import { useMyStep, usePlayerBoard } from '@/sync/usePlayerStep'

import type { Role } from './PhaseRouter'

export function MicrolearningRenderer({
  phase,
  role,
  sessionId,
  playerId,
}: {
  phase: Phase & { type: 'microlearning' }
  role: Role
  sessionId: string
  playerId?: string
}) {
  const c = phase.content
  if (c.type !== 'microlearning') return null
  if (role === 'player' && playerId)
    return <PlayerPane content={c} sessionId={sessionId} playerId={playerId} />
  return <MonitorPane content={c} title={phase.title} sessionId={sessionId} />
}

function PlayerPane({
  content,
  sessionId,
  playerId,
}: {
  content: MicrolearningContent
  sessionId: string
  playerId: string
}) {
  const [step, setStep] = useMyStep(sessionId, playerId)
  const bounded = Math.min(step, content.steps.length - 1)
  const current = content.steps[bounded]
  const isLast = bounded === content.steps.length - 1
  const text = current.blocks.find((b) => b.kind === 'text')?.markdown ?? current.id

  return (
    <div className="flex max-w-lg flex-col gap-4 p-6">
      <p className="text-xs text-gray-400">
        Step {bounded + 1}/{content.steps.length}
      </p>
      <pre className="font-sans text-base whitespace-pre-wrap">{text}</pre>
      <button
        onClick={() => setStep(bounded + 1)}
        disabled={isLast}
        className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-40"
      >
        {isLast ? 'Done' : 'Next'}
      </button>
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
