import { useState } from 'react'

import { AnswerSavedScreen } from '@/components/AnswerSavedScreen'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'
import type { MicroStep, Phase, Question } from '@helden-inc/tg-schema'
import { serverTimestamp, set } from 'firebase/database'

import { StepScreen } from '@/phases/Microlearning/PlayerPane/QuestionScreen'
import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'
import { TimerRing } from '@/phases/Quiz/TimerRing'

import { eref } from '@/lib/firebase'
import { useTimer } from '@/lib/sync/useTimer'

import type { AnalyzeGridConfig } from './score'
import { isAnalyzeGridGateCorrect } from './score'

const BORDER = '#353535'

// Team mode: only the leader plays; members see the "focus on the leader"
// screen (Router gates team_leader_only; this also treats team_collaborative
// members the same way as sort_order does).
//
// Flow (storyboard): [intro] → grid ("Kumpulkan") → analysis questions one per
// screen → "Jawaban Tersimpan!". Gate/score/submit logic is unchanged.
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
  const showRing = timer.active && !!phase.timer && phase.timer.visibleTo.includes('player')

  // Starts empty: pre-marking the key auto-passed the gate before the player
  // acted, so "Kumpulkan" succeeded with zero taps.
  const [marked, setMarked] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  // After a wrong check: which marked cells were right (ok) / wrong (bad),
  // shown until the player changes the marks.
  const [feedback, setFeedback] = useState<Record<string, 'ok' | 'bad'> | null>(null)
  const [gatePassed, setGatePassed] = useState(false)
  const [introDone, setIntroDone] = useState(!config.intro)
  const [questionAnswers, setQuestionAnswers] = useState<unknown[]>(() =>
    config.analysisQuestions.map(() => null)
  )
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // One analysis question per screen; both gate check and final submit go
  // through an "apakah kamu yakin" confirm, correct or not.
  const [qIndex, setQIndex] = useState(0)
  const [confirm, setConfirm] = useState<'gate' | 'submit' | 'back' | null>(null)

  // Up to 3 marks per the AC (the 4×6 board has exactly 3 empty cells).
  const maxMarks = config.emptyCells.length
  const keySet = new Set(config.emptyCells.map((c) => `${c.row}/${c.col}`))
  const toggle = (row: string, col: string) => {
    if (gatePassed || timer.expired) return
    const key = `${row}/${col}`
    setFeedback(null)
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
      setFeedback(null)
    } else {
      setAttempts((a) => a + 1)
      setFeedback(Object.fromEntries(marked.map((k) => [k, keySet.has(k) ? 'ok' : 'bad'])))
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

  const dialog = confirm && (
    <ConfirmDialog
      title={confirm === 'back' ? 'Kembali ke penjelasan?' : 'Apakah kamu yakin?'}
      message={
        confirm === 'back'
          ? 'Proses ini tidak akan menyimpan jawabanmu.'
          : confirm === 'gate'
            ? 'Jawaban kotakmu akan diverifikasi sekarang.'
            : 'Jawabanmu akan dikirim dan tidak bisa diubah lagi.'
      }
      confirmLabel={
        confirm === 'gate' ? 'Verifikasi' : confirm === 'submit' ? 'Kirim' : 'Lanjutkan'
      }
      cancelLabel={confirm === 'back' ? 'Kembali' : 'Periksa lagi'}
      onCancel={() => setConfirm(null)}
      onConfirm={() => {
        const kind = confirm
        setConfirm(null)
        if (kind === 'gate') checkGate()
        else if (kind === 'back') {
          setMarked([])
          setFeedback(null)
          setAttempts(0)
          setIntroDone(false)
        } else void submitAnswers()
      }}
    />
  )

  // ── Opening screen ───────────────────────────────────────────────────────
  if (!introDone && config.intro) {
    const step: MicroStep = {
      id: `${phaseId}-intro`,
      title: config.intro.title,
      blocks: [
        {
          kind: 'image',
          mediaId: '',
          url: config.intro.imageUrl,
          title: config.intro.title,
          caption: config.intro.steps.map((s) => `- ${s}`).join('\n'),
        },
      ],
    }
    return (
      <StepScreen
        step={step}
        phase={phase}
        sessionId={sessionId}
        playerId={writerId}
        answers={{}}
        drafts={{}}
        onDraftChange={() => {}}
        disabled={false}
        actionLabel="Mulai"
        actionDisabled={false}
        onAction={() => setIntroDone(true)}
        canWrite
      />
    )
  }

  // ── Analysis questions (after the gate) ──────────────────────────────────
  if (gatePassed) {
    const total = config.analysisQuestions.length
    const i = Math.min(qIndex, total - 1)
    const q = config.analysisQuestions[i] as unknown as Question
    const isLast = i === total - 1
    const step: MicroStep = {
      id: `${phaseId}-q${i}`,
      title: i === 0 ? config.successMessage : undefined,
      blocks: [{ kind: 'question', question: q }],
    }
    return (
      <>
        <StepScreen
          key={i}
          step={step}
          phase={phase}
          sessionId={sessionId}
          playerId={writerId}
          answers={{}}
          drafts={{ 0: questionAnswers[i] ?? undefined }}
          onDraftChange={(_idx, v) =>
            setQuestionAnswers((prev) => prev.map((x, j) => (j === i ? v : x)))
          }
          disabled={timer.expired || busy}
          actionLabel={busy ? 'Mengirim…' : isLast ? 'Kumpulkan' : 'Selanjutnya'}
          actionDisabled={
            questionAnswers[i] === null || busy || timer.expired || (isLast && !allAnswered)
          }
          onAction={() => (isLast ? setConfirm('submit') : setQIndex(i + 1))}
          secondaryAction={
            i > 0 ? { label: 'Sebelumnya', onClick: () => setQIndex(i - 1) } : undefined
          }
          canWrite
        />
        {dialog}
      </>
    )
  }

  // ── Grid ─────────────────────────────────────────────────────────────────
  return (
    <>
      <PlayerScreenFrame
        panelClassName="gap-5 p-4"
        onBack={config.intro ? () => setConfirm('back') : undefined}
        footer={
          <ActionButton
            disabled={marked.length !== maxMarks || timer.expired}
            onClick={() => setConfirm('gate')}
          >
            Kumpulkan
          </ActionButton>
        }
      >
        {showRing && phase.timer && (
          <TimerRing
            remainingSec={timer.remainingSec}
            totalSec={phase.timer.seconds}
            expired={timer.expired}
            size={88}
            className="mx-auto"
          />
        )}

        <div className="flex flex-col items-center gap-1 text-center">
          {config.title && <h2 className="text-xl font-semibold text-white">{config.title}</h2>}
          <p className="text-sm text-white/80">Harap tandai {maxMarks} sel yang kosong!</p>
        </div>

        <div className="rounded-lg border p-3" style={{ borderColor: BORDER }}>
          <div
            className="grid items-center gap-2"
            style={{
              gridTemplateColumns: `auto repeat(${config.colLabels.length}, minmax(0, 1fr))`,
            }}
          >
            <span />
            {config.colLabels.map((c) => (
              <span key={c} className="text-center text-[10px] text-white/80">
                {c}
              </span>
            ))}
            {config.rowLabels.map((r) => (
              <GridRow
                key={r}
                row={r}
                cols={config.colLabels}
                marked={marked}
                feedback={feedback}
                onToggle={toggle}
              />
            ))}
          </div>
        </div>

        {attempts > 0 && (
          <p className="text-center text-sm text-red-400">Belum tepat — coba lagi ({attempts})</p>
        )}
      </PlayerScreenFrame>
      {dialog}
    </>
  )
}

function GridRow({
  row,
  cols,
  marked,
  feedback,
  onToggle,
}: {
  row: string
  cols: string[]
  marked: string[]
  feedback: Record<string, 'ok' | 'bad'> | null
  onToggle: (row: string, col: string) => void
}) {
  return (
    <>
      <span className="pr-1 text-center text-sm font-bold text-[#FDDB00]">{row}</span>
      {cols.map((c) => {
        const key = `${row}/${c}`
        const active = marked.includes(key)
        const fb = feedback?.[key]
        const border =
          fb === 'ok'
            ? '#26890C'
            : fb === 'bad'
              ? '#E21B3C'
              : active
                ? '#FDDB00'
                : 'rgba(255, 255, 255, 0.1)'
        const tint =
          fb === 'ok'
            ? 'rgba(38, 137, 12, 0.35)'
            : fb === 'bad'
              ? 'rgba(226, 27, 60, 0.3)'
              : active
                ? 'rgba(253, 219, 0, 0.18)'
                : '#1B1B1B'
        return (
          <button
            key={c}
            type="button"
            aria-label={`${row} ${c}`}
            aria-pressed={active}
            onClick={() => onToggle(row, c)}
            className="aspect-[2/3] w-full rounded-lg border transition-colors"
            style={{ borderColor: border, background: tint }}
          />
        )
      })}
    </>
  )
}
