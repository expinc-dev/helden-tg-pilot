import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'

import { LeaderboardRows } from '../../components/LeaderboardRows'
import { type QuizContent } from '../../lib'

// Full-bleed override shown on central when the host toggles "Leaderboard"
// during a quiz phase (see useLeaderboardOpen in ../../lib).
export function LeaderboardScreen({
  sessionId,
  phase,
  content,
}: {
  sessionId: string
  phase: Phase
  content: QuizContent
}) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center gap-8 p-12"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <h1 className="text-4xl font-bold text-white">Leaderboard</h1>

      <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <LeaderboardRows sessionId={sessionId} phase={phase} content={content} />
      </div>
    </div>
  )
}
