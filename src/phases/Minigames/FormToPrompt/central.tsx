import type { Phase } from '@helden-inc/tg-schema'

import { useAnswerProgress } from '@/phases/Quiz/lib'

import type { FormToPromptConfig } from './score'

// Central screen for L4b — storyboard §4b, verbatim:
//   "Instruksi langkah + progress 'berapa peserta sudah submit' (untuk host
//    pantau, netral). TIDAK tampilkan isi kerja siapa pun."
//
// So this shows the instructions and a count, and NOTHING else. The count comes
// from `aggregates/answeredCount/{phaseId}` via the Quiz hook because the
// writer (lib/session/formToPrompt.ts) goes through `submitAnswer`, which is the
// only writer that bumps that leaf. It is deliberately a bare number with no
// names and no per-participant rows: the room must not be able to tell who is
// behind and who is not.
//
// `useAnsweredCount` counts SUBMISSIONS, so a participant who re-submits after
// editing (allowed — the button stays live) shows as one, not two: the
// aggregate's per-key guard makes the second bump a rolled-back no-op. The
// counter is therefore "how many have finished", which is what the host needs
// to call 4c.
export function FormToPromptCentral({
  sessionId,
  phase,
  config,
}: {
  sessionId: string
  phase: Phase
  config: FormToPromptConfig
}) {
  const { answered, total } = useAnswerProgress(sessionId, phase, phase.id)

  return (
    <div className="bg-helden-base flex min-h-dvh flex-col items-center justify-center p-10 text-center text-white">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <h1 className="bg-helden-yellow-gradient bg-clip-text text-4xl leading-[1.15] font-bold tracking-tight text-transparent">
          {phase.title}
        </h1>

        {config.instructions && (
          <p className="text-xl leading-9 whitespace-pre-line text-white/80">
            {config.instructions}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
          <span className="text-helden-title text-3xl font-bold">
            {answered}
            <span className="text-white/30"> / {total}</span>
          </span>
          <span className="text-sm text-white/50">sudah mengirim</span>
        </div>

        <p className="text-sm text-white/40">
          Yang lain masih bisa menyusul. Beri waktu sebentar lagi.
        </p>
      </div>
    </div>
  )
}
