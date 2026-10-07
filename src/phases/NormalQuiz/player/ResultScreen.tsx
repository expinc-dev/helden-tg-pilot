import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'

import { type NormalQuizContent, qIdOf } from '../lib'

type Verdict = 'correct' | 'wrong' | 'unanswered' | 'pending'

const VERDICT: Record<Verdict, { label: string; color: string }> = {
  correct: { label: 'Benar', color: '#51CE92' },
  wrong: { label: 'Salah', color: '#F26B6B' },
  unanswered: { label: 'Tidak dijawab', color: '#B8B8B8' },
  // Answered after the host's grading pass: no verdict written for it yet.
  pending: { label: 'Menunggu penilaian', color: '#B8B8B8' },
}

// What a player sees once the host has graded. Everything comes from the player's
// own aggregates nodes (questionOutcome / questionScores) — the correct answer is
// never sent to the device, only "right" or "wrong" per question. With
// revealAnswers off, only the total points are shown.
export function ResultScreen({
  content,
  phaseId,
  playerId,
  step,
  outcomes,
  points,
}: {
  content: NormalQuizContent
  phaseId: string
  playerId: string
  // selfStep: questions at or beyond it were never answered.
  step: number
  outcomes: Record<string, Record<string, 'correct' | 'wrong'>>
  points: Record<string, Record<string, number>>
}) {
  const total = content.questions.length
  const rows = content.questions.map((_, i) => {
    const qId = qIdOf(phaseId, i)
    const outcome = outcomes[qId]?.[playerId]
    const verdict: Verdict = i >= step ? 'unanswered' : (outcome ?? 'pending')
    return { i, verdict }
  })
  const earned = content.questions.reduce(
    (sum, _, i) => sum + (points[qIdOf(phaseId, i)]?.[playerId] ?? 0),
    0
  )
  const correct = rows.filter((r) => r.verdict === 'correct').length

  return (
    <PlayerScreenFrame panelClassName="gap-8 px-5 pt-10 pb-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xl font-bold text-white">Hasil Kuis</p>
        <p
          className="bg-clip-text text-6xl leading-none font-bold text-transparent"
          style={{
            backgroundImage:
              'linear-gradient(173deg, rgb(253, 219, 0) 14.619%, rgb(253, 164, 0) 68.407%)',
          }}
        >
          {Math.round(earned)}
        </p>
        <p className="text-sm text-white/60">poin</p>
        {content.revealAnswers && (
          <p className="text-base text-white/80">
            {correct} dari {total} benar
          </p>
        )}
      </div>

      {content.revealAnswers && (
        <div className="flex flex-col gap-2">
          {rows.map(({ i, verdict }) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ borderColor: '#353535' }}
            >
              <span className="text-sm text-white/80">Soal {i + 1}</span>
              <span className="text-sm font-semibold" style={{ color: VERDICT[verdict].color }}>
                {VERDICT[verdict].label}
              </span>
            </div>
          ))}
        </div>
      )}
    </PlayerScreenFrame>
  )
}
