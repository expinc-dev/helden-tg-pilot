import { SessionEnd } from '@/components/SessionEnd'

import type { Role } from '../PhaseRouter'
import { type EndContent, resolveEndContent } from './lib'

// The authored end phase: the closing title/text/image every role sees, plus
// the session's final scores. Unlike EndScreen (which replaces the whole page
// once meta.status === 'ended'), this renders while the session is still 'live'
// — the end phase is a real phase in phaseOrder, so the pointer can land on it
// before the host ends the session. Both go through the same SessionEnd, so the
// two closing screens look identical. Scores are already there when it does:
// flushPhaseResults writes aggregates/scores|teamScores at every phase
// boundary, before the pointer moves (lib/session/flush.ts).
export function EndRenderer({
  content,
  title,
  role,
  sessionId,
  playerId,
  teamId,
}: {
  content: EndContent
  title: string
  role: Role
  sessionId: string
  playerId?: string
  teamId?: string
}) {
  const view = resolveEndContent(content, role, title)
  return (
    <SessionEnd
      role={role}
      sessionId={sessionId}
      title={view.title}
      subtitle={view.text}
      imageUrl={view.imageUrl}
      playerId={playerId}
      teamId={teamId}
      // The host's live card already provides the frame and the advance button.
      embedded
    />
  )
}
