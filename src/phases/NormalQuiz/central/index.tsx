import { assets } from '@/assets'
import { CentralOverallProgress } from '@/components/CentralOverallProgress'
import type { Phase } from '@helden-inc/tg-schema'

import { LeaderboardRows } from '@/phases/Quiz/components/LeaderboardRows'

import { usePlayerBoard } from '@/lib/sync/usePlayerStep'

import { type NormalQuizContent, useNormalQuizOutcomes } from '../lib'

// Central never shows the question: the room is working on their own phones. Until
// the host grades it is a nameless overall-progress screen (same one microlearning
// switches to late in its phase); afterwards, the leaderboard.
export function CentralNormalQuiz({
  content,
  sessionId,
  phase,
}: {
  content: NormalQuizContent
  sessionId: string
  phase: Phase
}) {
  const rows = usePlayerBoard(sessionId, phase.id)
  const { released } = useNormalQuizOutcomes(sessionId, phase.id)
  const total = content.questions.length

  if (released) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center gap-10 px-[5.5%] py-[4%]"
        style={{
          backgroundImage: `url(${assets.images.backgrounds.central})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <h1 className="text-5xl font-medium text-white">Hasil Kuis</h1>
        <div
          className="min-h-0 w-full flex-1 overflow-y-auto rounded-md border"
          style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.6)' }}
        >
          <LeaderboardRows
            sessionId={sessionId}
            phase={phase}
            content={content}
            revealedCount={total}
            variant="segments"
          />
        </div>
      </div>
    )
  }

  const connected = rows.filter((r) => r.connected)
  const finished = connected.filter((r) => r.selfStep >= total).length
  return <CentralOverallProgress finished={finished} total={connected.length} />
}
