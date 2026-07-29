import { useEffect, useState } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { onValue, ref, set } from 'firebase/database'

import { rtdb } from '@/lib/firebase'

export type QuizContent = Extract<Phase['content'], { type: 'quiz' }>

export const OPTION_COLORS = [
  { bg: '#E21B3C', text: '#fff' },
  { bg: '#1368CE', text: '#fff' },
  { bg: '#D89E00', text: '#000' },
  { bg: '#26890C', text: '#fff' },
]

export const OPTION_ICONS = ['mdi:circle', 'mdi:rhombus', 'mdi:triangle', 'mdi:square-rounded']

export type ChoiceOption = { id: string; label: string }

export function promptText(q: { prompt: unknown[] }): string {
  return q.prompt
    .map((b) =>
      typeof b === 'object' && b !== null && 'markdown' in b
        ? (b as { markdown?: string }).markdown
        : ''
    )
    .join(' ')
}

export function questionOptions(q: unknown): ChoiceOption[] {
  return q &&
    typeof q === 'object' &&
    'options' in q &&
    Array.isArray((q as { options: unknown }).options)
    ? (q as { options: ChoiceOption[] }).options
    : []
}

export function resolveTimers(content: QuizContent) {
  return {
    reading: content.readingTimerSeconds ?? 8,
    answering: content.answeringTimerSeconds ?? content.perQuestionTimerSeconds ?? 20,
  }
}

export function useAnsweredCount(sessionId: string | undefined, qId: string): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/aggregates/answeredCount/${qId}`), (s) => {
      setCount(typeof s.val() === 'number' ? s.val() : 0)
    })
  }, [sessionId, qId])
  return count
}

export function useDistribution(
  sessionId: string | undefined,
  qId: string
): Record<string, number> {
  const [dist, setDist] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/aggregates/distribution/${qId}`), (s) => {
      setDist((s.val() as Record<string, number>) ?? {})
    })
  }, [sessionId, qId])
  return dist
}

export function useTotalPlayers(sessionId: string | undefined): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/players`), (s) => {
      setCount(s.val() ? Object.keys(s.val()).length : 0)
    })
  }, [sessionId])
  return count
}

export function usePlayerScore(
  sessionId: string | undefined,
  playerId: string,
  phase: Phase
): number {
  const isTeam = phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  const path = isTeam ? `teamScores` : `scores/${playerId}`
  const [score, setScore] = useState(0)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/aggregates/${path}`), (s) => {
      setScore(typeof s.val() === 'number' ? s.val() : 0)
    })
  }, [sessionId, path])
  return score
}

export function useScoresMap(sessionId: string | undefined, phase: Phase): Record<string, number> {
  const isTeam = phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  const path = isTeam ? 'teamScores' : 'scores'
  const [scores, setScores] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/aggregates/${path}`), (s) => {
      setScores((s.val() as Record<string, number>) ?? {})
    })
  }, [sessionId, path])
  return scores
}

// Host writes, central listens — scoped to the quiz phase only (Q1/Q2): the
// host clears it back to false whenever the question advances.
export function useLeaderboardOpen(sessionId: string | undefined): boolean {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/leaderboardOpen`), (s) => {
      setOpen(!!s.val())
    })
  }, [sessionId])
  return open
}

export function writeLeaderboardOpen(sessionId: string, open: boolean) {
  return set(ref(rtdb, `sessions/${sessionId}/leaderboardOpen`), open)
}

// Cumulative correct/wrong counts per player (or team), scoped per quiz phase
// (keyed by phaseId) so the leaderboard bar's denominator is "this quiz's
// question count", not a lifetime tally. Written by scoreQuizQuestion on reveal.
export function useAnswerTally(
  sessionId: string | undefined,
  phase: Phase
): { correct: Record<string, number>; wrong: Record<string, number> } {
  const isTeam = phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  const base = isTeam ? `teamCorrectCount/${phase.id}` : `correctCount/${phase.id}`
  const wrongBase = isTeam ? `teamWrongCount/${phase.id}` : `wrongCount/${phase.id}`
  const [correct, setCorrect] = useState<Record<string, number>>({})
  const [wrong, setWrong] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/aggregates/${base}`), (s) => {
      setCorrect((s.val() as Record<string, number>) ?? {})
    })
  }, [sessionId, base])

  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/aggregates/${wrongBase}`), (s) => {
      setWrong((s.val() as Record<string, number>) ?? {})
    })
  }, [sessionId, wrongBase])

  return { correct, wrong }
}

export function usePlayerNames(sessionId: string | undefined): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/players`), (s) => {
      const val = s.val() as Record<string, { name?: string }> | null
      if (!val) return
      const map: Record<string, string> = {}
      for (const [id, p] of Object.entries(val)) {
        if (p?.name) map[id] = p.name
      }
      setNames(map)
    })
  }, [sessionId])
  return names
}
