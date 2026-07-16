import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { assets } from '@/assets'
import { GradientButton } from '@/components/GradientButton'
import type { Phase } from '@helden-inc/tg-schema'
import { onValue, ref } from 'firebase/database'

import { demoBundle } from '@/lib/demoBundle'
import { rtdb } from '@/lib/firebase'
import { endLevel, nextPhase, quizAnswerKeys } from '@/lib/session/control'
import { scoreQuizQuestion } from '@/lib/session/quizScoring'
import { submitAnswer } from '@/lib/sync/submitAnswer'
import { mmss } from '@/lib/sync/timermath'
import { useQuizStep } from '@/lib/sync/useQuizStep'
import { useTimer } from '@/lib/sync/useTimer'

import type { Role } from './PhaseRouter'

type QuizContent = Extract<Phase['content'], { type: 'quiz' }>

const OPTION_COLORS = [
  { bg: '#E21B3C', text: '#fff' }, // red
  { bg: '#1368CE', text: '#fff' }, // blue
  { bg: '#D89E00', text: '#000' }, // yellow
  { bg: '#26890C', text: '#fff' }, // green
]

function promptText(q: { prompt: unknown[] }): string {
  return q.prompt
    .map((b) =>
      typeof b === 'object' && b !== null && 'markdown' in b
        ? (b as { markdown?: string }).markdown
        : ''
    )
    .join(' ')
}

// Options only exist on single_choice/multi_choice variants of Question — the
// pilot's quiz UI is choice-based, so anything else falls through with [].
type ChoiceOption = { id: string; label: string }
function questionOptions(q: unknown): ChoiceOption[] {
  return q &&
    typeof q === 'object' &&
    'options' in q &&
    Array.isArray((q as { options: unknown }).options)
    ? (q as { options: ChoiceOption[] }).options
    : []
}

function resolveTimers(content: QuizContent) {
  return {
    reading: content.readingTimerSeconds ?? 8,
    answering: content.answeringTimerSeconds ?? content.perQuestionTimerSeconds ?? 20,
  }
}

// ─── Entry ──────────────────────────────────────────────────────────────────

export function QuizRenderer({
  content,
  role,
  sessionId,
  phaseId,
  playerId,
  teamId,
  phase,
}: {
  content: QuizContent
  role: Role
  sessionId: string
  phaseId: string
  playerId?: string
  teamId?: string
  phase: Phase
}) {
  if (role === 'player')
    return (
      <PlayerQuiz
        content={content}
        sessionId={sessionId}
        phaseId={phaseId}
        playerId={playerId!}
        teamId={teamId}
        phase={phase}
      />
    )
  if (role === 'central')
    return <CentralQuiz content={content} sessionId={sessionId} phaseId={phaseId} phase={phase} />
  return <HostQuiz content={content} sessionId={sessionId} phaseId={phaseId} phase={phase} />
}

// ─── Central ────────────────────────────────────────────────────────────────

function CentralQuiz({
  content,
  sessionId,
  phaseId,
  phase,
}: {
  content: QuizContent
  sessionId: string
  phaseId: string
  phase: Phase
}) {
  const { quizStep } = useQuizStep(sessionId)
  const timer = useTimer(sessionId, phase)
  const q = content.questions[quizStep.step]
  const answeredCount = useAnsweredCount(sessionId, `${phaseId}_q${quizStep.step}`)
  const totalPlayers = useTotalPlayers(sessionId)

  if (!q) return null

  const text = promptText(q)
  const showQuestion = quizStep.stage !== 'preparation'

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Counter */}
      <div className="rounded-full bg-white/10 px-5 py-1.5 text-lg font-medium text-white/70">
        {quizStep.step + 1} / {content.questions.length}
      </div>

      {/* Preparation: just the title */}
      {quizStep.stage === 'preparation' && (
        <>
          <div className="text-7xl">🎯</div>
          <h1 className="text-4xl font-bold text-[#FFB800]">Bersiap!</h1>
          <div className="h-1 w-40 animate-pulse rounded-full bg-[#FFB800]/30" />
        </>
      )}

      {/* Reading + Answering + Reveal: show question */}
      {showQuestion && (
        <h1 className="max-w-4xl text-center text-4xl leading-tight font-bold text-white drop-shadow-lg">
          {text}
        </h1>
      )}

      {/* Reading timer */}
      {quizStep.stage === 'reading' && timer.active && (
        <>
          <div
            className="text-7xl font-bold tabular-nums"
            style={{ color: timer.remainingSec <= 3 ? '#E21B3C' : '#FFB800' }}
          >
            {mmss(timer.remainingSec)}
          </div>
          <div className="text-xl text-white/50">Baca pertanyaan...</div>
        </>
      )}

      {/* Answering timer + count */}
      {quizStep.stage === 'answering' && (
        <>
          {timer.active && (
            <div
              className="text-7xl font-bold tabular-nums"
              style={{ color: timer.remainingSec <= 5 ? '#E21B3C' : '#FFB800' }}
            >
              {timer.expired ? 'Waktu habis!' : mmss(timer.remainingSec)}
            </div>
          )}
          <div className="flex items-center gap-3 rounded-full bg-white/10 px-6 py-2 text-xl text-white/80">
            <span className="font-bold text-[#FFB800]">{answeredCount}</span>
            <span>/</span>
            <span>{totalPlayers}</span>
            <span className="text-white/50">menjawab</span>
          </div>
        </>
      )}

      {/* Options (answering + reveal) */}
      {(quizStep.stage === 'answering' || quizStep.stage === 'reveal') &&
        questionOptions(q).length > 0 && (
          <div className="grid w-full max-w-4xl grid-cols-2 gap-4">
            {questionOptions(q).map((opt, i) => {
              const color = OPTION_COLORS[i % OPTION_COLORS.length]
              const isCorrect = quizStep.stage === 'reveal' && quizStep.correctId === opt.id
              return (
                <div
                  key={opt.id}
                  className="relative overflow-hidden rounded-xl p-6 text-center text-xl font-semibold shadow-lg transition-all duration-300"
                  style={{
                    background: color.bg,
                    color: color.text,
                    opacity: quizStep.stage === 'reveal' && !isCorrect ? 0.35 : 1,
                    transform: isCorrect ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {opt.label}
                  {isCorrect && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-green-600 shadow">
                      ✓
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

      {/* Reveal: distribution + leaderboard */}
      {quizStep.stage === 'reveal' && (
        <RevealOverlay
          sessionId={sessionId}
          phaseId={phaseId}
          questionIndex={quizStep.step}
          options={questionOptions(q)}
          phase={phase}
        />
      )}
    </div>
  )
}

// ─── Player ─────────────────────────────────────────────────────────────────

function PlayerQuiz({
  content,
  sessionId,
  phaseId,
  playerId,
  teamId,
  phase,
}: {
  content: QuizContent
  sessionId: string
  phaseId: string
  playerId: string
  teamId?: string
  phase: Phase
}) {
  const { quizStep } = useQuizStep(sessionId)
  const timer = useTimer(sessionId, phase)
  const q = content.questions[quizStep.step]
  const myScore = usePlayerScore(sessionId, playerId, phase)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const lastStepRef = useRef(-1)
  const timers = resolveTimers(content)

  useEffect(() => {
    if (quizStep.step !== lastStepRef.current) {
      lastStepRef.current = quizStep.step
      setSubmitted(null)
      setSubmitting(false)
    }
  }, [quizStep.step])

  // Reconnect recovery
  useEffect(() => {
    const qId = `${phaseId}_q${quizStep.step}`
    return onValue(
      ref(rtdb, `sessions/${sessionId}/players/${playerId}/answers/${qId}`),
      (s) => {
        if (s.val()) setSubmitted(s.val().value as string)
      },
      { onlyOnce: true }
    )
  }, [sessionId, playerId, phaseId, quizStep.step])

  if (!q) return null

  const isTeamMode =
    phase.teamMode === 'team_leader_only' || phase.teamMode === 'team_collaborative'
  const keyId = isTeamMode && teamId ? teamId : playerId

  const handleAnswer = async (optionId: string) => {
    if (submitted || submitting) return
    setSubmitting(true)
    const qId = `${phaseId}_q${quizStep.step}`
    await submitAnswer({ sessionId, playerId, keyId, qId, value: optionId, optionId })
    setSubmitted(optionId)
    setSubmitting(false)
  }

  const canAnswer = quizStep.stage === 'answering' && !timer.expired && !submitted

  // ── Preparation ──
  if (quizStep.stage === 'preparation') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#121212] p-8">
        <div className="text-7xl">🎯</div>
        <h2 className="text-3xl font-bold text-[#FFB800]">Bersiap!</h2>
        <p className="text-lg text-white/50">
          Pertanyaan {quizStep.step + 1} / {content.questions.length}
        </p>
        <div className="mt-2 h-1 w-32 animate-pulse rounded-full bg-[#FFB800]/30" />
      </div>
    )
  }

  // ── Reading ──
  if (quizStep.stage === 'reading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#121212] p-8">
        <div className="text-5xl">📺</div>
        <h2 className="text-2xl font-bold text-white">Perhatikan Layar Utama</h2>
        <p className="text-white/40">Pertanyaan sedang ditampilkan...</p>
        {timer.active && (
          <div
            className="mt-2 text-4xl font-bold tabular-nums"
            style={{ color: timer.remainingSec <= 3 ? '#E21B3C' : '#FFB800' }}
          >
            {mmss(timer.remainingSec)}
          </div>
        )}
      </div>
    )
  }

  // ── Answering ──
  if (quizStep.stage === 'answering') {
    return (
      <div className="flex min-h-dvh flex-col bg-[#121212]">
        {/* Timer */}
        {timer.active && (
          <div className="flex flex-col items-center gap-1 px-4 pt-4">
            <span
              className="text-4xl font-bold tabular-nums"
              style={{ color: timer.remainingSec <= 5 ? '#E21B3C' : '#FFB800' }}
            >
              {timer.expired ? '⏰' : mmss(timer.remainingSec)}
            </span>
            {!timer.expired && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#FFB800] transition-all duration-1000 ease-linear"
                  style={{
                    width: `${Math.max(0, (timer.remainingSec / timers.answering) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {submitted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#26890C]/20">
              <span className="text-4xl text-[#26890C]">✓</span>
            </div>
            <p className="text-xl font-semibold text-white">Jawaban terkirim!</p>
            <p className="text-white/40">Menunggu jawaban lainnya...</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-end gap-3 p-4 pb-8">
            {questionOptions(q).map((opt, i) => {
              const color = OPTION_COLORS[i % OPTION_COLORS.length]
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!canAnswer}
                  onClick={() => handleAnswer(opt.id)}
                  className="rounded-xl p-5 text-lg font-bold shadow-lg transition-all active:scale-[0.97] disabled:opacity-40"
                  style={{ background: color.bg, color: color.text }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Reveal ──
  const isCorrect = submitted === quizStep.correctId

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#121212] p-8">
      {submitted ? (
        <>
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full"
            style={{ background: isCorrect ? '#26890C20' : '#E21B3C20' }}
          >
            <span className="text-6xl">{isCorrect ? '🎉' : '😢'}</span>
          </div>
          <h2 className="text-3xl font-bold" style={{ color: isCorrect ? '#26890C' : '#E21B3C' }}>
            {isCorrect ? 'Benar!' : 'Salah!'}
          </h2>
          <div className="flex flex-col items-center gap-1">
            <p className="text-5xl font-bold text-[#FFB800]">{myScore}</p>
            <p className="text-sm text-white/40">poin total</p>
          </div>
        </>
      ) : (
        <>
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/5">
            <span className="text-6xl">⏰</span>
          </div>
          <h2 className="text-2xl font-bold text-white/50">Tidak menjawab</h2>
        </>
      )}
    </div>
  )
}

// ─── Host (state machine authority) ─────────────────────────────────────────
//
// The host drives the quiz state machine. ALL stage transitions happen here and
// are written to centralStep — other clients react via useQuizStep. The quiz
// uses its OWN timer (sessions/{id}/timer) for reading and answering countdowns.
// The global phase timer (autoAdvanceOnExpire) is NOT used — quiz.timer is
// undefined in the demoBundle, so the lobby's global auto-advance never fires.

function HostQuiz({
  content,
  sessionId,
  phaseId,
  phase,
}: {
  content: QuizContent
  sessionId: string
  phaseId: string
  phase: Phase
}) {
  const { quizStep, write, startTimer, clearTimer } = useQuizStep(sessionId)
  const timer = useTimer(sessionId, phase)
  const q = content.questions[quizStep.step]
  const answeredCount = useAnsweredCount(sessionId, `${phaseId}_q${quizStep.step}`)
  const totalPlayers = useTotalPlayers(sessionId)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const scoredRef = useRef<string | null>(null)

  const isLastQuestion = quizStep.step >= content.questions.length - 1
  const timers = resolveTimers(content)

  // ── Callbacks (declared before the auto-advance effect) ──

  const handlePreparation = useCallback(
    (step: number) => {
      scoredRef.current = null
      void write({ step, stage: 'preparation', correctId: undefined })
    },
    [write]
  )

  // Timer BEFORE stage write — otherwise the old expired timer is still visible
  // when the new stage arrives, and the auto-advance effect fires with a stale
  // (expired) timer + fresh stage → reading→answering immediately re-fires into
  // reveal, skipping the whole answering window.
  const handleStartReading = useCallback(async () => {
    await startTimer(phaseId, timers.reading)
    await write({ step: quizStep.step, stage: 'reading' })
  }, [write, startTimer, phaseId, timers.reading, quizStep.step])

  const handleStartAnswering = useCallback(async () => {
    await startTimer(phaseId, timers.answering)
    await write({ step: quizStep.step, stage: 'answering' })
  }, [write, startTimer, phaseId, timers.answering, quizStep.step])

  const handleReveal = useCallback(async () => {
    await clearTimer()
    // Rules deny reads on secrets/* for everyone (incl. host) — read the key
    // from the host-only module map instead of a round-trip that gets denied.
    const correctId = quizAnswerKeys[phaseId]?.[quizStep.step] ?? ''
    await write({ step: quizStep.step, stage: 'reveal', correctId })

    const scoreKey = `${phaseId}_q${quizStep.step}`
    if (scoredRef.current !== scoreKey) {
      scoredRef.current = scoreKey
      await scoreQuizQuestion({
        sessionId,
        phase,
        questionIndex: quizStep.step,
        correctId,
        timerSeconds: timers.answering,
      })
    }
  }, [clearTimer, write, sessionId, phaseId, quizStep.step, phase, timers.answering])

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      const isModular = (demoBundle.flowMode ?? 'sequential') !== 'sequential'
      void (isModular ? endLevel(sessionId, phaseId) : nextPhase(sessionId, phaseId))
    } else {
      handlePreparation(quizStep.step + 1)
    }
  }, [isLastQuestion, sessionId, phaseId, quizStep.step, handlePreparation])

  // ── Auto-advance on timer expiry (local quiz timers only, never global) ──

  useEffect(() => {
    if (!timer.active || !timer.expired) return
    if (quizStep.stage === 'reading') {
      handleStartAnswering()
    } else if (quizStep.stage === 'answering') {
      handleReveal()
    }
  }, [quizStep.stage, timer.active, timer.expired, handleStartAnswering, handleReveal])

  if (!q) return null

  const text = promptText(q)
  const stageLabel =
    quizStep.stage === 'preparation'
      ? 'Persiapan'
      : quizStep.stage === 'reading'
        ? 'Membaca'
        : quizStep.stage === 'answering'
          ? 'Menjawab'
          : 'Reveal'

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#FFB800]/10 px-3 py-1 text-sm font-medium text-[#FFB800]">
            Soal {quizStep.step + 1} / {content.questions.length}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/40">
            {stageLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLeaderboardOpen((o) => !o)}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 transition hover:bg-white/10"
        >
          {leaderboardOpen ? 'Tutup' : '🏆 Leaderboard'}
        </button>
      </div>

      {/* Question card (visible from reading onward) */}
      {quizStep.stage !== 'preparation' && (
        <div className="rounded-xl border border-white/10 bg-[#181818] p-5">
          <p className="text-lg leading-relaxed font-semibold text-white">{text}</p>
        </div>
      )}

      {/* ── Preparation ── */}
      {quizStep.stage === 'preparation' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <div className="text-5xl">🎯</div>
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-8 py-4 text-center">
            <p className="text-sm text-white/40">Semua layar menampilkan</p>
            <p className="mt-1 text-lg font-medium text-white/70">"Bersiap!"</p>
          </div>
          <GradientButton onClick={handleStartReading} className="px-10 py-3.5 text-lg">
            Mulai ▶
          </GradientButton>
        </div>
      )}

      {/* ── Reading ── */}
      {quizStep.stage === 'reading' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          {timer.active && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-white/40">Waktu baca</span>
              <span
                className="font-mono text-5xl font-bold tabular-nums"
                style={{ color: timer.remainingSec <= 3 ? '#E21B3C' : '#FFB800' }}
              >
                {mmss(timer.remainingSec)}
              </span>
            </div>
          )}
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-8 py-4 text-center">
            <p className="text-sm text-white/40">Pemain melihat</p>
            <p className="mt-1 text-lg font-medium text-white/70">"📺 Perhatikan Layar Utama"</p>
          </div>
          <p className="text-sm text-white/30">Jawaban otomatis terbuka saat waktu baca habis</p>
        </div>
      )}

      {/* ── Answering ── */}
      {quizStep.stage === 'answering' && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
            {timer.active && (
              <span
                className="font-mono text-3xl font-bold tabular-nums"
                style={{ color: timer.remainingSec <= 5 ? '#E21B3C' : '#FFB800' }}
              >
                {timer.expired ? '⏰ Waktu habis' : mmss(timer.remainingSec)}
              </span>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-[#FFB800]">{answeredCount}</span>
              <span className="text-white/40">/ {totalPlayers} menjawab</span>
            </div>
          </div>

          <DistributionBars
            sessionId={sessionId}
            phaseId={phaseId}
            questionIndex={quizStep.step}
            options={questionOptions(q)}
            showCorrect={false}
          />

          <GradientButton onClick={handleReveal} className="mt-auto px-6 py-3 text-base">
            Reveal Jawaban
          </GradientButton>
        </div>
      )}

      {/* ── Reveal ── */}
      {quizStep.stage === 'reveal' && (
        <div className="flex flex-1 flex-col gap-4">
          <DistributionBars
            sessionId={sessionId}
            phaseId={phaseId}
            questionIndex={quizStep.step}
            options={questionOptions(q)}
            showCorrect
            correctId={quizStep.correctId}
          />

          <GradientButton onClick={handleNext} className="mt-auto px-6 py-3 text-base">
            {isLastQuestion ? '✓ Selesai' : 'Soal Berikutnya →'}
          </GradientButton>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboardOpen && <LeaderboardPanel sessionId={sessionId} phase={phase} />}
    </div>
  )
}

// ─── Shared components ───────────────────────────────────────────────────────

function DistributionBars({
  sessionId,
  phaseId,
  questionIndex,
  options,
  showCorrect,
  correctId,
}: {
  sessionId: string
  phaseId: string
  questionIndex: number
  options: { id: string; label: string }[]
  showCorrect: boolean
  correctId?: string
}) {
  const dist = useDistribution(sessionId, `${phaseId}_q${questionIndex}`)
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt, i) => {
        const count = dist[opt.id] ?? 0
        const pct = Math.round((count / total) * 100)
        const color = OPTION_COLORS[i % OPTION_COLORS.length]
        const isCorrect = showCorrect && correctId === opt.id

        return (
          <div key={opt.id} className="flex items-center gap-3">
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className={`${isCorrect ? 'font-bold text-green-400' : 'text-white/80'}`}>
                  {opt.label} {isCorrect && '✓'}
                </span>
                <span className="font-mono text-white/50">{count}</span>
              </div>
              <div className="h-7 w-full overflow-hidden rounded-lg bg-white/10">
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: color.bg,
                    opacity: showCorrect && !isCorrect ? 0.3 : 1,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RevealOverlay({
  sessionId,
  phaseId,
  questionIndex,
  options,
  phase,
}: {
  sessionId: string
  phaseId: string
  questionIndex: number
  options: { id: string; label: string }[]
  phase: Phase
}) {
  const scores = useScoresMap(sessionId, phase)
  const sorted = useMemo(
    () =>
      Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    [scores]
  )
  const playerNames = usePlayerNames(sessionId)

  return (
    <div className="flex w-full max-w-4xl gap-6">
      <div className="flex-1">
        <DistributionBars
          sessionId={sessionId}
          phaseId={phaseId}
          questionIndex={questionIndex}
          options={options}
          showCorrect
          correctId={undefined}
        />
      </div>

      <div className="w-80 rounded-xl border border-white/10 bg-black/50 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-center text-lg font-bold text-[#FFB800]">🏆 Leaderboard</h3>
        {sorted.length === 0 ? (
          <p className="text-center text-sm text-white/30">Belum ada skor</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map(([id, score], i) => (
              <div
                key={id}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5"
              >
                <span className="text-white">
                  <span className="mr-2 font-bold text-[#FFB800]">#{i + 1}</span>
                  {playerNames[id] ?? id.slice(0, 8)}
                </span>
                <span className="font-mono font-bold text-[#FFB800]">{score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LeaderboardPanel({ sessionId, phase }: { sessionId: string; phase: Phase }) {
  const scores = useScoresMap(sessionId, phase)
  const playerNames = usePlayerNames(sessionId)
  const sorted = useMemo(() => Object.entries(scores).sort(([, a], [, b]) => b - a), [scores])

  return (
    <div className="rounded-xl border border-white/10 bg-[#181818] p-4">
      <h3 className="mb-3 text-sm font-bold text-[#FFB800]">🏆 Leaderboard</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-white/30">Belum ada skor</p>
      ) : (
        <div className="flex flex-col gap-1">
          {sorted.map(([id, score], i) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.03]"
            >
              <span className="text-white/80">
                <span className="mr-2 font-bold text-[#FFB800]">#{i + 1}</span>
                {playerNames[id] ?? id.slice(0, 8)}
              </span>
              <span className="font-mono font-bold text-[#FFB800]">{score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useAnsweredCount(sessionId: string | undefined, qId: string): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/aggregates/answeredCount/${qId}`), (s) => {
      setCount(typeof s.val() === 'number' ? s.val() : 0)
    })
  }, [sessionId, qId])
  return count
}

function useDistribution(sessionId: string | undefined, qId: string): Record<string, number> {
  const [dist, setDist] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/aggregates/distribution/${qId}`), (s) => {
      setDist((s.val() as Record<string, number>) ?? {})
    })
  }, [sessionId, qId])
  return dist
}

function useTotalPlayers(sessionId: string | undefined): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!sessionId) return
    return onValue(ref(rtdb, `sessions/${sessionId}/players`), (s) => {
      setCount(s.val() ? Object.keys(s.val()).length : 0)
    })
  }, [sessionId])
  return count
}

function usePlayerScore(sessionId: string | undefined, playerId: string, phase: Phase): number {
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

function useScoresMap(sessionId: string | undefined, phase: Phase): Record<string, number> {
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

function usePlayerNames(sessionId: string | undefined): Record<string, string> {
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
