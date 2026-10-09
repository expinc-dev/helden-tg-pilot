import { CentralQuestionWall } from '@/components/CentralQuestionWall'

import { useTotalPlayers } from '@/phases/Quiz/lib'

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
  // Everyone who joined (not only who is online now), never below the answers in.
  const joined = useTotalPlayers(sessionId)

  return (
    <CentralQuestionWall
      prompt={content.prompt}
      answered={answered.length}
      total={Math.max(joined, answered.length)}
    />
  )
}
