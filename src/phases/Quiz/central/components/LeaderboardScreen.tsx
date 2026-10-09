import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'

import { demoBundle } from '@/lib/demoBundle'

import { levelBundleOf } from '../../bundleGroup'
import { LeaderboardRows } from '../../components/LeaderboardRows'
import { type QuizContent } from '../../lib'

// Full-bleed screen shown on central when the quiz's centralStep enters the
// 'leaderboard' stage — its own dedicated step, not an overlay that can show
// mid-reveal (see QuizStage in @/lib/sync/useQuizStep).
export function LeaderboardScreen({
  sessionId,
  phase,
  content,
  questionId,
  revealedCount,
}: {
  sessionId: string
  phase: Phase
  content: QuizContent
  questionId?: string
  revealedCount: number
}) {
  const isTeam = phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  // Level 3A–3C: one combined bar per team, one block per lettered phase.
  const bundle = levelBundleOf(demoBundle.phaseOrder, demoBundle.phases, phase)
  return (
    <div
      className="fixed inset-0 flex flex-col items-center gap-10 px-[5.5%] py-[4%]"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <h1 className="text-5xl font-medium text-white">
        {isTeam ? 'Kemajuan Tim' : 'Kemajuan Pemain'}
      </h1>

      <div
        className="min-h-0 w-full flex-1 overflow-y-auto rounded-md border"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.6)' }}
      >
        <LeaderboardRows
          sessionId={sessionId}
          phase={phase}
          content={content}
          questionId={questionId}
          revealedCount={revealedCount}
          variant="segments"
          bundle={bundle}
        />
      </div>
    </div>
  )
}
