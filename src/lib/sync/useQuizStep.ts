import { useCallback, useEffect, useState } from 'react'

import type { SessionTimer } from '@helden-inc/tg-schema'
import { onValue, ref, remove, set, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

import { serverOffsetOnce } from '../session/control'

export type QuizStage = 'answering' | 'reveal' | 'leaderboard'

export interface QuizStep {
  step: number
  stage: QuizStage
  correctId?: string
}

const DEFAULT: QuizStep = { step: 0, stage: 'answering' }

export function useQuizStep(sessionId: string | undefined) {
  const [quizStep, setQuizStep] = useState<QuizStep>(DEFAULT)
  // Whether centralStep has ever been written for this phase — false right
  // after openPhase() removes the node, distinguishing "genuinely unstarted"
  // from "legitimately sitting at step 0 answering" (both look like DEFAULT).
  // The host uses this to bootstrap question 0 without a dedicated stage.
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/centralStep`), (s) => {
      const val = s.val()
      if (!val) {
        setQuizStep(DEFAULT)
        setStarted(false)
        return
      }
      setStarted(true)
      setQuizStep({
        step: typeof val.step === 'number' ? val.step : 0,
        stage: val.stage ?? 'answering',
        correctId: val.correctId,
      })
    })
  }, [sessionId])

  const write = useCallback(
    (patch: Partial<QuizStep>) => {
      if (!sessionId) return
      // RTDB update() throws on undefined; null means "delete key" — translate.
      const clean = Object.fromEntries(
        Object.entries(patch).map(([k, v]) => [k, v === undefined ? null : v])
      )
      return update(ref(rtdb, `sessions/${sessionId}/centralStep`), clean)
    },
    [sessionId]
  )

  const startTimer = useCallback(
    async (phaseId: string, seconds: number) => {
      if (!sessionId) return
      const offset = await serverOffsetOnce()
      const timer: SessionTimer = { phaseId, endsAt: Date.now() + offset + seconds * 1000 }
      await set(ref(rtdb, `sessions/${sessionId}/timer`), timer)
    },
    [sessionId]
  )

  const clearTimer = useCallback(() => {
    if (!sessionId) return
    return remove(ref(rtdb, `sessions/${sessionId}/timer`))
  }, [sessionId])

  return { quizStep, started, write, startTimer, clearTimer }
}
