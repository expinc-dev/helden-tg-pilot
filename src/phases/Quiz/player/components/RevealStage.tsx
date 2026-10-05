import { AnswerSavedScreen } from '@/components/AnswerSavedScreen'

// Kahoot reveal on the player's phone — Figma "Success": the same centred
// result screen as "Jawaban Tersimpan!", titled with the verdict. The subtitle
// carries the points: "+N poin" for this question (once the host's scoring
// pass has written it) and the running total.
export function RevealStage({
  submitted,
  isCorrect,
  graded = true,
  gained,
  total,
}: {
  submitted: string | null
  isCorrect: boolean
  // false for an opinion question (no answer key): no right/wrong verdict.
  graded?: boolean
  gained?: number
  total?: number
}) {
  const points =
    gained === undefined
      ? 'Menghitung poin...'
      : `+${Math.round(gained)} poin · Total ${Math.round(total ?? 0)} poin`
  if (!submitted) {
    return (
      <AnswerSavedScreen
        tone="neutral"
        title="Tidak Menjawab"
        subtitle={gained === undefined ? 'Menunggu soal berikutnya...' : points}
      />
    )
  }
  if (!graded) return <AnswerSavedScreen title="Jawaban Tersimpan!" subtitle={points} />
  return isCorrect ? (
    <AnswerSavedScreen title="Jawaban Benar!" subtitle={points} />
  ) : (
    <AnswerSavedScreen tone="error" title="Jawaban Salah!" subtitle={points} />
  )
}
