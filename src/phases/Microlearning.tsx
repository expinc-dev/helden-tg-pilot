import type { Phase } from '@helden-inc/tg-schema'
import type { Role } from './PhaseRouter'

export function MicrolearningRenderer({ phase, role }: { phase: Phase & { type: 'microlearning' }; role: Role }) {
  const c = phase.content
  if (c.type !== 'microlearning') return null
  return (
    <div className="p-8 flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{phase.title}</h2>
      <p className="text-xs text-gray-400">{role} · mode: {c.mode} · {c.steps.length} step(s)</p>
      <ol className="list-decimal ml-6 text-sm text-gray-700">
        {c.steps.map((s) => <li key={s.id}>{s.id} · {s.blocks.length} block(s)</li>)}
      </ol>
      <p className="text-xs text-gray-400">Interaction lands in T-runtime-03.</p>
    </div>
  )
}
