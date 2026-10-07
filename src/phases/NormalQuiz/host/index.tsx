import { useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GradientButton } from '@/components/GradientButton'
import { HostNextPhaseButton } from '@/pages/host/_shared/HostNextPhaseButton'
import { HostScreenFrame } from '@/pages/host/_shared/HostScreenFrame'
import { PlayerLabel, ProgressRow, SubmittedStrip } from '@/pages/host/_shared/ProgressRow'
import type { Phase } from '@helden-inc/tg-schema'

import { LeaderboardRows } from '@/phases/Quiz/components/LeaderboardRows'

import { scoreAllNormalQuizQuestions } from '@/lib/session/quizScoring'
import { useGameType } from '@/lib/sync/useGameType'
import { usePlayerBoard } from '@/lib/sync/usePlayerStep'

import { type NormalQuizContent, useNormalQuizOutcomes } from '../lib'

const BUTTON_CLASS = 'h-16 w-full text-lg font-medium! tracking-[-0.04em]'

// selfStep counts finished questions, and `total` is the finish sentinel — same
// reading as the microlearning host pane.
function progressPct(step: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((Math.min(Math.max(step, 0), total) / total) * 100)
}

// Host: watch every player's progress, then grade once they are done. Grading runs
// HERE because only the host's (full) bundle holds the correctIds — the player-safe
// bundle strips them, so players can never grade themselves.
export function HostNormalQuiz({
  content,
  sessionId,
  phase,
  onAdvance,
}: {
  content: NormalQuizContent
  sessionId: string
  phase: Phase
  onAdvance?: () => void
}) {
  const rows = usePlayerBoard(sessionId, phase.id)
  const gameType = useGameType()
  const { released } = useNormalQuizOutcomes(sessionId, phase.id)
  const [grading, setGrading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [gradeError, setGradeError] = useState(false)

  const total = content.questions.length
  const connected = rows.filter((r) => r.connected)
  const finished = connected.filter((r) => r.selfStep >= total).length
  const notFinished = connected.length - finished

  const grade = async () => {
    setConfirmOpen(false)
    setGrading(true)
    setGradeError(false)
    try {
      await scoreAllNormalQuizQuestions({ sessionId, phase, questions: content.questions })
    } catch (e) {
      console.error('normal quiz grading failed', e)
      setGradeError(true)
    } finally {
      setGrading(false)
    }
  }

  // Grading releases the results to every player at once and ends the quiz for
  // anyone still answering, so ask first when someone is mid-way.
  // Only before the first release: once results are out, everyone mid-way has
  // already been cut off, so re-grading (to pick up in-flight answers) has
  // nothing left to warn about — and the dialog would sit over the next button.
  const onGradeClick = () => {
    if (!released && notFinished > 0) setConfirmOpen(true)
    else void grade()
  }

  return (
    <HostScreenFrame
      badge={gameType}
      title={released ? 'Hasil Kuis' : 'Progres Kuis'}
      subtitle={
        released
          ? 'Hasil sudah ditampilkan ke semua pemain'
          : 'Pantau progres setiap pemain secara real-time'
      }
      bodyClassName="gap-4"
      footer={
        <div className="flex shrink-0 flex-col gap-4">
          <GradientButton
            type="button"
            disabled={grading || total === 0}
            onClick={onGradeClick}
            className={BUTTON_CLASS}
          >
            {grading ? 'Menilai...' : released ? 'Nilai Ulang' : 'Nilai & Tampilkan Hasil'}
          </GradientButton>
          {onAdvance && <HostNextPhaseButton onConfirm={onAdvance} className={BUTTON_CLASS} />}
          {confirmOpen && (
            <ConfirmDialog
              title="Nilai sekarang?"
              message={`${notFinished} pemain belum selesai. Hasil langsung tampil ke semua pemain dan mereka tidak bisa melanjutkan menjawab. Soal yang belum dijawab dihitung salah.`}
              confirmLabel="Nilai Sekarang"
              onCancel={() => setConfirmOpen(false)}
              onConfirm={() => void grade()}
            />
          )}
        </div>
      }
    >
      <SubmittedStrip done={finished} total={connected.length} verb="menyelesaikan kuis" />
      {gradeError && (
        <p className="text-center text-sm text-[#F26B6B]">Gagal menilai. Coba tekan tombol lagi.</p>
      )}

      {released ? (
        // LeaderboardRows' columns have fixed widths (rank, avatar, 10rem name, score):
        // on a narrow host window they would clip the bar and the score. A min-width
        // inside a horizontal scroller keeps every column readable at any width.
        <div className="overflow-x-auto rounded-lg border border-[#353535]">
          <div className="min-w-[560px]">
            <LeaderboardRows
              sessionId={sessionId}
              phase={phase}
              content={content}
              revealedCount={total}
            />
          </div>
        </div>
      ) : (
        rows.map((r) => (
          <ProgressRow key={r.id} pct={progressPct(r.selfStep, total)} dim={!r.connected}>
            <PlayerLabel name={r.name} />
          </ProgressRow>
        ))
      )}
    </HostScreenFrame>
  )
}
