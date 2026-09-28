import type { Phase, PlayerPresence } from '@helden-inc/tg-schema'

import { usePresence } from '@/lib/sync/useSession'

export type ReflectionContent = Extract<Phase['content'], { type: 'reflection' }>
export type ReflectionAnswer = { text: string; scale: number }

export type ReflectionRow = {
  id: string
  name: string
  connected: boolean
  answer?: ReflectionAnswer
}

// Host / Central: read incoming answers + scale average. No reveal, no
// per-player "correct/wrong" — just who's answered and the room's average
// scale rating. Central gets a nameless version (public screen); host gets
// the full per-player spread (folded into one monitor pane).
export function useReflectionResponses(sessionId: string, phaseId: string): ReflectionRow[] {
  const { players } = usePresence(sessionId)
  return Object.entries(players).map(([id, p]) => {
    const pv = p as PlayerPresence & {
      answers?: Record<string, { value?: ReflectionAnswer }>
    }
    return {
      id,
      name: pv.name,
      connected: pv.connected,
      answer: pv.answers?.[phaseId]?.value,
    }
  })
}

export function useReflectionStats(sessionId: string, phaseId: string) {
  const rows = useReflectionResponses(sessionId, phaseId)
  const answered = rows.filter((r) => r.answer)
  const avgScale = answered.length
    ? Math.round(
        (answered.reduce((sum, r) => sum + (r.answer?.scale ?? 0), 0) / answered.length) * 10
      ) / 10
    : null
  return { rows, answered, avgScale }
}
