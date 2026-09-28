import { useScoreMaps } from '@/lib/sync/useScoreboard'

import type { Role } from '../PhaseRouter'
import { Scoreboard } from './Scoreboard'
import { type EndContent, resolveEndContent } from './lib'

// The board owns its own name lookups (see Scoreboard), so every role gets the
// same pane — there is no longer a labels-bearing variant a caller can forget
// to use. Scores are the only input.
function ScoresPane({ sessionId }: { sessionId: string }) {
  const { scores, teamScores } = useScoreMaps(sessionId)

  return (
    <Scoreboard
      sessionId={sessionId}
      scores={scores}
      teamScores={teamScores}
      variant="dark"
      emptyText="Belum ada skor di sesi ini."
    />
  )
}

// The authored end phase: the closing title/text/image every role sees, plus
// the session's final scores next to it. Unlike EndScreen (which replaces the
// whole page once meta.status === 'ended'), this renders while the session is
// still 'live' — the end phase is a real phase in phaseOrder, so the pointer
// can land on it before the host ends the session. Scores are already there
// when it does: flushPhaseResults writes aggregates/scores|teamScores at every
// phase boundary, before the pointer moves (lib/session/flush.ts).
export function EndRenderer({
  content,
  title,
  role,
  sessionId,
}: {
  content: EndContent
  title: string
  role: Role
  sessionId: string
}) {
  const view = resolveEndContent(content, role, title)

  return (
    <div className="bg-helden-base flex min-h-dvh flex-col items-center justify-center gap-10 p-8 text-white">
      <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
        {view.imageUrl && (
          <img src={view.imageUrl} alt="" className="max-h-64 w-auto rounded-2xl object-contain" />
        )}
        {view.title && (
          <h1 className="text-helden-title text-4xl font-bold tracking-tight">{view.title}</h1>
        )}
        {view.text && (
          <p className="text-helden-body text-lg leading-relaxed whitespace-pre-line">
            {view.text}
          </p>
        )}
      </div>

      <div className="w-full max-w-2xl">
        <ScoresPane sessionId={sessionId} />
      </div>
    </div>
  )
}
