import { useMemo } from 'react'

import type { Phase } from '@helden-inc/tg-schema'

import { useTeams } from '@/lib/sync/useTeams'

import { type BundleBlock, bundleOutcomes } from '../bundleGroup'
import {
  type QuizContent,
  useAnswerTally,
  useIsTeamScored,
  usePlayerRoster,
  useQuestionOutcomes,
  useQuestionScores,
  useScoresMap,
} from '../lib'
import { type QuestionOutcome, questionOutcomes } from '../outcomes'

const SEGMENT_COLOR: Record<QuestionOutcome, string> = {
  correct: '#4FD18B',
  wrong: '#E21B3C',
  unanswered: '#FDDB00',
  pending: '#6B6B6B',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Shared row list (rank, avatar initials, name, per-question verdicts, score)
// used by both central's full-bleed LeaderboardScreen and the host's leaderboard
// stage — same data, two different chrome wrappers around it.
//
// Right / wrong / unanswered per question is derived live from the players'
// own answers (the same source as the host's red/green option marks), so it
// never waits on the host's scoring pass; only the points come from the host's
// aggregates. Team modes keep the team aggregates (a team verdict needs the
// leader/majority rule), shown as green/red then grey.
export function LeaderboardRows({
  sessionId,
  phase,
  content,
  questionId,
  revealedCount,
  variant = 'bar',
  bundle,
}: {
  sessionId: string
  phase: Phase
  // Only `questions` is read, so a normal quiz (NormalQuizContent) can reuse this
  // board as-is — it has no `mode`, which the full QuizContent would require.
  content: Pick<QuizContent, 'questions'>
  // When set, each row also shows the points earned on that question ("+N").
  questionId?: string
  // How many questions have been opened to the room (questions at or beyond
  // this index are still "pending").
  revealedCount: number
  // 'segments' = central "Kemajuan" board: one segment per question. Default
  // 'bar' keeps the host panel's single bar.
  variant?: 'bar' | 'segments'
  // 'segments' only: one block per phase of a lettered level (3A/3B/3C) instead
  // of one per question, so the whole level reads as a single bar. Phases not
  // scored yet stay grey.
  bundle?: BundleBlock[] | null
}) {
  const isTeam = useIsTeamScored(sessionId, phase)
  const scores = useScoresMap(sessionId, phase)
  const roster = usePlayerRoster(sessionId)
  const teams = useTeams(sessionId)
  const tally = useAnswerTally(sessionId, phase)
  const questionScores = useQuestionScores(sessionId, questionId ?? '_none')
  const totalQuestions = content.questions.length
  const bundled = variant === 'segments' && bundle ? bundle : null
  const bundleOutcomeMap = useQuestionOutcomes(sessionId, !!bundled)

  const rows = useMemo(() => {
    type Row = {
      id: string
      name: string
      score: number
      gained: number
      outcomes: QuestionOutcome[]
    }
    let list: Row[]
    if (bundled) {
      // Team or individual: aggregates/questionOutcome is keyed by the same id
      // as the score map (teamId in team modes, playerId otherwise).
      const names = isTeam
        ? Object.fromEntries(teams.map((t) => [t.id, t.teamName ?? t.id]))
        : Object.fromEntries(roster.map((p) => [p.id, p.name]))
      list = Object.entries(scores).map(([id, score]) => ({
        id,
        name: names[id] ?? id.slice(0, 6),
        score,
        gained: questionScores[id] ?? 0,
        outcomes: bundleOutcomes(bundled, id, bundleOutcomeMap),
      }))
    } else if (isTeam) {
      const names = Object.fromEntries(teams.map((t) => [t.id, t.teamName ?? t.id]))
      list = Object.entries(scores).map(([id, score]) => {
        const correct = tally.correct[id] ?? 0
        const wrong = tally.wrong[id] ?? 0
        const outcomes: QuestionOutcome[] = Array.from({ length: totalQuestions }, (_, k) =>
          k < correct ? 'correct' : k < correct + wrong ? 'wrong' : 'pending'
        )
        return {
          id,
          name: names[id] ?? id.slice(0, 6),
          score,
          gained: questionScores[id] ?? 0,
          outcomes,
        }
      })
    } else {
      list = roster.map((p) => ({
        id: p.id,
        name: p.name,
        score: scores[p.id] ?? 0,
        gained: questionScores[p.id] ?? 0,
        outcomes: questionOutcomes({
          questions: content.questions,
          answers: p.answers,
          phaseId: phase.id,
          revealedCount,
        }),
      }))
    }
    const correctOf = (r: Row) => r.outcomes.filter((o) => o === 'correct').length
    return list.sort((a, b) => b.score - a.score || correctOf(b) - correctOf(a))
  }, [
    isTeam,
    teams,
    scores,
    tally,
    roster,
    questionScores,
    content.questions,
    phase.id,
    revealedCount,
    totalQuestions,
    bundled,
    bundleOutcomeMap,
  ])

  if (rows.length === 0) {
    return <p className="p-8 text-center text-white/40">Belum ada skor</p>
  }

  return (
    <>
      {rows.map((row, i) => {
        if (variant === 'segments') {
          return (
            <div key={row.id} className="flex items-center gap-8 px-10 py-5">
              <span className="w-10 shrink-0 text-3xl font-medium text-white">{i + 1}.</span>
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-bold text-black ring-2 ring-[#FDDB00]">
                {initials(row.name)}
              </div>
              <span className="w-72 shrink-0 truncate text-3xl text-white">{row.name}</span>
              <div className="flex flex-1 items-center gap-5">
                {row.outcomes.map((o, k) => (
                  <div key={k} className="flex flex-1 flex-col gap-1">
                    {bundled && (
                      <span className="text-center text-sm font-medium text-white/60">
                        {bundled[k]?.label}
                      </span>
                    )}
                    <div
                      className="h-6 rounded transition-colors duration-300"
                      style={{ background: SEGMENT_COLOR[o] }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex w-56 shrink-0 items-baseline justify-end gap-4">
                {questionId && (
                  <span className="text-xl font-semibold text-[#4FD18B]">
                    +{Math.round(row.gained)}
                  </span>
                )}
                <span className="text-3xl font-bold text-[#FFB800]">{Math.round(row.score)}</span>
              </div>
            </div>
          )
        }
        const correct = row.outcomes.filter((o) => o === 'correct').length
        const missed = row.outcomes.filter((o) => o === 'wrong' || o === 'unanswered').length
        const correctPct = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0
        const wrongPct = totalQuestions > 0 ? (missed / totalQuestions) * 100 : 0
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
            {questionId && (
              <span className="w-14 shrink-0 text-right text-sm font-semibold text-[#34D399]">
                +{Math.round(row.gained)}
              </span>
            )}
            <span className="w-16 shrink-0 text-right font-bold text-[#FFB800]">
              {Math.round(row.score)}
            </span>
          </div>
        )
      })}
    </>
  )
}
