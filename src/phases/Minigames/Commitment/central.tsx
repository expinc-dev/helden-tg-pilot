import type { Phase } from '@helden-inc/tg-schema'

import { useAnswerProgress } from '@/phases/Quiz/lib'

import type { CommitmentConfig } from './score'

// Central screen for the closing commitment — storyboard "Bagian 1", central
// column: "Pertanyaan komitmen + instruksi. Tidak tampilkan jawaban siapa pun
// (privat)."
//
// That instruction is the entire design of this screen, so it is worth being
// explicit about what is NOT here and why:
//   - no answers, no excerpts, no sample sentences. The room just spent three
//     hours writing; putting the first commitment on the wall turns a private
//     resolution into a performance, and the ones who wrote something shaky
//     would be the ones it costs most.
//   - no per-participant rows and no names, so the count cannot be read as a
//     leaderboard of who is ready and who is not.
//   - no `usePresence`: unlike form_to_prompt's count, a presence-derived figure
//     would carry identities into a zone that is projected to the whole room.
//
// What IS here is the instruction and a bare "berapa yang sudah mengirim", which
// is what the host needs to decide when to move to Bagian 2. The count comes
// from `aggregates/answeredCount/{phaseId}` via the Quiz hook because the writer
// (lib/session/commitment.ts) goes through `submitAnswer`, the only writer that
// bumps that leaf.
//
// The question is restated here in the author's own `instructions` rather than a
// separate field: the participant answers the same sentences they read on their
// phone, and two copies of that paragraph would drift.
export function CommitmentCentral({
  sessionId,
  phase,
  config,
}: {
  sessionId: string
  phase: Phase
  config: CommitmentConfig
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
          <span className="text-sm text-white/50">sudah menulis komitmen</span>
        </div>

        <p className="text-sm text-white/40">
          Jawabannya privat — cuma untuk kamu sendiri. Nanti dibawa pulang.
        </p>
      </div>
    </div>
  )
}
