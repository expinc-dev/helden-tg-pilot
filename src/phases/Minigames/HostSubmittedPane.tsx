import { HostPanelHeader } from '@/pages/host/_shared/HostScreenFrame'
import { SubmittedStrip } from '@/pages/host/_shared/ProgressRow'
import type { Phase } from '@helden-inc/tg-schema'

import { usePresence } from '@/lib/sync/useSession'

import { useAnalyzeSubmitted } from './AnalyzeGrid/status'

// Host panel for the individual, private closing templates (form_to_prompt,
// commitment, journey): the room-wide count only. Names are deliberately not
// listed next to anything — these phases never show who wrote what.
export function HostSubmittedPane({
  sessionId,
  phase,
  title,
  subtitle,
  showCount = true,
}: {
  sessionId: string
  phase: Phase
  title: string
  subtitle: string
  showCount?: boolean
}) {
  const { players } = usePresence(sessionId)
  const roster = Object.entries(players).map(([id, p]) => ({
    key: id,
    writerId: id,
    label: p.name,
  }))
  const submitted = useAnalyzeSubmitted(sessionId, roster, phase.id)
  const done = roster.filter((r) => submitted[r.writerId]).length

  return (
    <div className="flex min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#353535_transparent] flex-col gap-16 overflow-y-auto px-8 pt-10 pb-8">
      <HostPanelHeader badge={null} title={title} subtitle={subtitle} />
      {showCount && <SubmittedStrip done={done} total={roster.length} />}
    </div>
  )
}
