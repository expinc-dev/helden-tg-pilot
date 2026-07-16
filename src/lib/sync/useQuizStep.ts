import { useCallback, useEffect, useState } from 'react'

import type { SessionTimer } from '@helden-inc/tg-schema'
import { onValue, ref, remove, set, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

import { serverOffsetOnce } from '../session/control'

export type QuizStage = 'preparation' | 'reading' | 'answering' | 'reveal'

export interface QuizStep {
  step: number
  stage: QuizStage
  correctId?: string
}

const DEFAULT: QuizStep = { step: 0, stage: 'preparation' }

export function useQuizStep(sessionId: string | undefined) {
  const [quizStep, setQuizStep] = useState<QuizStep>(DEFAULT)

  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/centralStep`), (s) => {
      const val = s.val()
      if (!val) {
        setQuizStep(DEFAULT)
        return
      }
      setQuizStep({
        step: typeof val.step === 'number' ? val.step : 0,
        stage: val.stage ?? 'preparation',
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

  return { quizStep, write, startTimer, clearTimer }
}
