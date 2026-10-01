import { useState } from 'react'

import { AnswerSavedScreen } from '@/components/AnswerSavedScreen'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Phase, Question } from '@helden-inc/tg-schema'
import { serverTimestamp, set } from 'firebase/database'

import { QuestionView } from '@/phases/Microlearning/PlayerPane/QuestionView'
import { ActionButton, SectionHeading } from '@/phases/Microlearning/PlayerPane/shared'

import { eref } from '@/lib/firebase'
import { useTimer } from '@/lib/sync/useTimer'

import type { AnalyzeGridConfig } from './score'
import { isAnalyzeGridGateCorrect } from './score'

// Team mode: only the leader plays; members see the "focus on the leader"
// screen (Router gates team_leader_only; this also treats team_collaborative
// members the same way as sort_order does).
export function AnalyzeGridPlayer({
  phase,
  config,
  sessionId,
  writerId,
}: {
  phase: Phase
  config: AnalyzeGridConfig
  sessionId: string
  writerId: string
}) {
  const phaseId = phase.id
  const timer = useTimer(sessionId, phase)

  // Starts empty: pre-marking the key auto-passed the gate before the player
  // acted, so "Verifikasi" succeeded with zero taps.
  const [marked, setMarked] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [gatePassed, setGatePassed] = useState(false)
  const [questionAnswers, setQuestionAnswers] = useState<unknown[]>(() =>
    config.analysisQuestions.map(() => null)
  )
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // One analysis question per screen; both gate check and final submit go
  // through an "apakah kamu yakin" confirm, correct or not.
  const [qIndex, setQIndex] = useState(0)
  const [confirm, setConfirm] = useState<'gate' | 'submit' | null>(null)

  // Up to 3 marks per the AC (the 4×6 board has exactly 3 empty cells).
  const maxMarks = config.emptyCells.length
  const toggle = (row: string, col: string) => {
    if (gatePassed || timer.expired) return
    const key = `${row}/${col}`
    setMarked((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= maxMarks) return prev
      return [...prev, key]
    })
  }

  const checkGate = () => {
    if (isAnalyzeGridGateCorrect(config, marked)) {
      setGatePassed(true)
      setAttempts(0)
    } else {
      setAttempts((a) => a + 1)
    }
  }

  const allAnswered = questionAnswers.every((a) => a !== null)
  const submitAnswers = async () => {
    if (!allAnswered || busy) return
    setBusy(true)
    await set(eref(`sessions/${sessionId}/players/${writerId}/answers/${phaseId}`), {
      value: { gate: [...marked], questions: questionAnswers },
      submittedAt: serverTimestamp(),
    })
    setSubmitted(true)
    setBusy(false)
  }

  // Final gate score (used by host central reveal / scrolling): correct if
  // the marked set matched exactly. Answers were ungraded single_choice.
  // Delegates to the scorer's comparison so the UI and the flushed score share
  // one definition of "correct" (see AnalyzeGrid/score.ts).
  const gateCorrect = isAnalyzeGridGateCorrect(config, marked)

  if (submitted) {
    return (
      <AnswerSavedScreen
        title={gateCorrect ? config.successMessage : 'Jawaban Tersimpan!'}
        subtitle="Menunggu pemain lainnya..."
      />
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#1F1F1F] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-md flex-1">
        <div className="flex flex-col items-center gap-1 pb-5 text-center">
          <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
        </div>

        {!gatePassed ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-white/50">
              Tandai sel yang tetap kosong ({maxMarks} sel)
            </p>
            <div className="overflow-x-auto">
              <table className="mx-auto border-collapse">
                <thead>
                  <tr>
                    <th />
                    {config.colLabels.map((c) => (
                      <th key={c} className="p-1 text-center text-xs text-white/50">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.rowLabels.map((r) => (
                    <tr key={r}>
                      <td className="p-1 text-right text-xs text-white/50">{r}</td>
                      {config.colLabels.map((c) => {
                        const active = marked.includes(`${r}/${c}`)
                        return (
                          <td key={c} className="p-1">
                            <button
                              type="button"
                              onClick={() => toggle(r, c)}
                              className={`size-9 rounded border text-sm font-semibold ${
                                active
                                  ? 'border-[#FDDB00] bg-[#FDDB00] text-black'
                                  : 'border-white/20 bg-white/5 text-white/40'
                              }`}
                            >
                              {active ? '✓' : ''}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {attempts > 0 && (
              <p className="text-center text-sm text-red-400">
                Belum tepat — coba lagi ({attempts})
              </p>
            )}

            <ActionButton
              disabled={marked.length !== maxMarks || timer.expired}
              onClick={() => setConfirm('gate')}
            >
              Verifikasi
            </ActionButton>
          </div>
        ) : (
          <div className="space-y-4">
            <SectionHeading text={config.successMessage} />
            {(() => {
              const total = config.analysisQuestions.length
              const i = Math.min(qIndex, total - 1)
              const q = config.analysisQuestions[i]
              const isLast = i === total - 1
              return (
                <>
                  <div key={i} className="space-y-2">
                    <p className="text-xs text-white/40">
                      Pertanyaan {i + 1} dari {total}
                    </p>
                    <p className="text-sm text-white/60">{qTypePrompt(q)}</p>
                    <QuestionView
                      question={q as Question}
                      answer={questionAnswers[i]}
                      draft={questionAnswers[i]}
                      onDraftChange={(v) =>
                        setQuestionAnswers((prev) => prev.map((x, j) => (j === i ? v : x)))
                      }
                      disabled={submitted || timer.expired}
                      sessionId={sessionId}
                      phase={phase}
                      playerId={writerId}
                    />
                  </div>
                  <ActionButton
                    disabled={
                      questionAnswers[i] === null ||
                      busy ||
                      timer.expired ||
                      (isLast && !allAnswered)
                    }
                    onClick={() => (isLast ? setConfirm('submit') : setQIndex(i + 1))}
                  >
                    {busy ? 'Mengirim…' : isLast ? 'Kirim Jawaban' : 'Selanjutnya'}
                  </ActionButton>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setQIndex(i - 1)}
                      className="mx-auto block text-xs text-white/40 hover:text-white/70"
                    >
                      &#8249; Kembali
                    </button>
                  )}
                </>
              )
            })()}
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title="Apakah kamu yakin?"
          message={
            confirm === 'gate'
              ? 'Jawaban kotakmu akan diverifikasi sekarang.'
              : 'Jawabanmu akan dikirim dan tidak bisa diubah lagi.'
          }
          confirmLabel={confirm === 'gate' ? 'Verifikasi' : 'Kirim'}
          cancelLabel="Periksa lagi"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const kind = confirm
            setConfirm(null)
            if (kind === 'gate') checkGate()
            else void submitAnswers()
          }}
        />
      )}
    </div>
  )
}

function qTypePrompt(q: Record<string, unknown>): string {
  const prompt = q.prompt as Array<{ kind?: string; markdown?: string }> | undefined
  const first = prompt?.[0]
  return first?.kind === 'text' ? (first.markdown ?? '') : ''
}
