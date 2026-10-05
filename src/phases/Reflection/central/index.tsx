import { CentralQuestionWall } from '@/components/CentralQuestionWall'

import { usePresenceCounts } from '@/lib/sync/useSession'

import type { ReflectionContent } from '../lib'
import { useReflectionStats } from '../lib'

// Big-screen view: the same question wall as the quiz and microlearning phases
// (prompt in the middle, "N dari M pemain telah menjawab" at the bottom).
// Nameless (public display): the answered count only — the scale average and
// the per-player list stay on the host's device.
export function CentralReflection({
  content,
  sessionId,
  phaseId,
}: {
  content: ReflectionContent
  sessionId: string
  phaseId: string
}) {
  const { answered } = useReflectionStats(sessionId, phaseId)
  const { players } = usePresenceCounts(sessionId)

  return <CentralQuestionWall prompt={content.prompt} answered={answered.length} total={players} />
}
