import { useEffect, useState } from 'react'

import type { NormalQuizContent, Question } from '@helden-inc/tg-schema'
import { onValue } from 'firebase/database'

import { eref } from '@/lib/firebase'

export type { NormalQuizContent }

// MUST stay `${phaseId}_q${index}`. scoreQuizQuestion (lib/session/quizScoring.ts),
// questionOutcomes (phases/Quiz/outcomes.ts) and the leaderboard all hardcode this
// exact qId, so a different shape here would silently stop the quiz being scored.
export const qIdOf = (phaseId: string, index: number) => `${phaseId}_q${index}`

export type ChoiceQuestion = Extract<Question, { qType: 'single_choice' }>

// tg-cms only lets authors build single_choice for a normal quiz (scoring compares
// one correctId as a plain string). A bundle that somehow carries anything else is
// treated as unsupported rather than crashing the player.
export const isChoiceQuestion = (q: Question | undefined): q is ChoiceQuestion =>
  q?.qType === 'single_choice'

type Outcome = 'correct' | 'wrong'
// aggregates/{node}/{qId}/{keyId}, keyed by playerId in individual mode (the only
// mode a normal quiz supports).
type PerQuestion<T> = Record<string, Record<string, T>>

// One aggregates/<node> subtree, narrowed to THIS phase's question ids. A plain
// onValue on the whole node + client-side filter (not an orderByKey range query):
// the node holds every quiz's questions, which is small, and it keeps this hook on
// the same minimal firebase surface every other sync hook uses.
function usePhaseAggregate<T>(
  sessionId: string | undefined,
  node: 'questionOutcome' | 'questionScores',
  phaseId: string
): PerQuestion<T> {
  const [data, setData] = useState<PerQuestion<T>>({})
  useEffect(() => {
    if (!sessionId) return
    const prefix = `${phaseId}_q`
    return onValue(eref(`sessions/${sessionId}/aggregates/${node}`), (s) => {
      const all = (s.val() ?? {}) as PerQuestion<T>
      const mine: PerQuestion<T> = {}
      for (const [qId, v] of Object.entries(all)) if (qId.startsWith(prefix)) mine[qId] = v
      setData(mine)
    })
  }, [sessionId, node, phaseId])
  return data
}

// Per-question verdicts the host's grading pass wrote (scoreQuizQuestion →
// aggregates/questionOutcome). `released` flips true once the host has graded this
// phase at least once: that is the one signal that "results are out" for host,
// central and player alike. It is deliberately NOT derived from aggregates/scores,
// which are cumulative across every phase of the session.
export function useNormalQuizOutcomes(sessionId: string | undefined, phaseId: string) {
  const outcomes = usePhaseAggregate<Outcome>(sessionId, 'questionOutcome', phaseId)
  return { outcomes, released: Object.keys(outcomes).length > 0 }
}

// Points earned per question (aggregates/questionScores), same shape as above.
export function useNormalQuizPoints(sessionId: string | undefined, phaseId: string) {
  return usePhaseAggregate<number>(sessionId, 'questionScores', phaseId)
}
