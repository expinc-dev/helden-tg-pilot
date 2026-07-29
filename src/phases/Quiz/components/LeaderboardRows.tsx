import { useMemo } from 'react'

import type { Phase } from '@helden-inc/tg-schema'

import { useTeams } from '@/lib/sync/useTeams'

import { type QuizContent, useAnswerTally, usePlayerNames, useScoresMap } from '../lib'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Shared row list (rank, avatar initials, name, correct/wrong bar, score) used
// by both central's full-bleed LeaderboardScreen and the host's floating
// LeaderboardPanel — same data, two different chrome wrappers around it.
// Each row's bar denominator is this quiz's total question count: green/red
// are cumulative correct/wrong so far, the remainder is questions not yet reached.
export function LeaderboardRows({
  sessionId,
  phase,
  content,
}: {
  sessionId: string
  phase: Phase
  content: QuizContent
}) {
  const isTeam = phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  const scores = useScoresMap(sessionId, phase)
  const playerNames = usePlayerNames(sessionId)
  const teams = useTeams(sessionId)
  const tally = useAnswerTally(sessionId, phase)
  const totalQuestions = content.questions.length

  const teamNames = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t.teamName ?? t.id])),
    [teams]
  )

  const rows = useMemo(() => {
    const names = isTeam ? teamNames : playerNames
    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([id, score]) => ({
        id,
        name: names[id] ?? id.slice(0, 6),
        score,
        correct: tally.correct[id] ?? 0,
        wrong: tally.wrong[id] ?? 0,
      }))
  }, [scores, tally, playerNames, teamNames, isTeam])

  if (rows.length === 0) {
    return <p className="p-8 text-center text-white/40">Belum ada skor</p>
  }

  return (
    <>
      {rows.map((row, i) => {
        const correctPct = totalQuestions > 0 ? (row.correct / totalQuestions) * 100 : 0
        const wrongPct = totalQuestions > 0 ? (row.wrong / totalQuestions) * 100 : 0
        return (
          <div
            key={row.id}
            className="flex items-center gap-4 border-b border-white/5 px-6 py-4 last:border-b-0"
          >
            <span className="w-6 text-lg text-white/50">{i + 1}.</span>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black ring-2 ring-[#FFB800]">
              {initials(row.name)}
            </div>
            <span className="w-40 shrink-0 truncate text-white">{row.name}</span>
            <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-[#34D399]" style={{ width: `${correctPct}%` }} />
              <div className="h-full bg-[#E21B3C]" style={{ width: `${wrongPct}%` }} />
            </div>
            <span className="w-16 shrink-0 text-right font-bold text-[#FFB800]">{row.score}</span>
          </div>
        )
      })}
    </>
  )
}
