import { AnswerSavedScreen } from '@/components/AnswerSavedScreen'

// Kahoot reveal on the player's phone — Figma "Success": the same centred
// result screen as "Jawaban Tersimpan!", titled with the verdict. No points
// here (the design drops "+N poin · Total N poin"): the subtitle only says the
// player is waiting on the room.
export function RevealStage({
  submitted,
  isCorrect,
  graded = true,
}: {
  submitted: string | null
  isCorrect: boolean
  // false for an opinion question (no answer key): no right/wrong verdict.
  graded?: boolean
}) {
  const waiting = 'Menunggu pemain lainnya...'
  if (!submitted) {
    return (
      <AnswerSavedScreen
        tone="neutral"
        title="Tidak Menjawab"
        subtitle="Menunggu soal berikutnya..."
      />
    )
  }
  if (!graded) return <AnswerSavedScreen title="Jawaban Tersimpan!" subtitle={waiting} />
  return isCorrect ? (
    <AnswerSavedScreen title="Jawaban Benar!" subtitle={waiting} />
  ) : (
    <AnswerSavedScreen tone="error" title="Jawaban Salah!" subtitle={waiting} />
  )
}
