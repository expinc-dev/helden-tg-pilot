import { CentralInstructionWall } from '@/components/CentralInstructionWall'
import { GridMock, SubmitMock } from '@/components/instructionMocks'
import type { Phase } from '@helden-inc/tg-schema'

import { useTimer } from '@/lib/sync/useTimer'

import { useAnalyzeRoster, useAnalyzeSubmitted } from './status'

// Central for analyze_grid (Figma instruction wall): how to play + timer + a bare
// submitted count. Nameless on purpose — per-team rows stay on the host screen.
// (The player writes a raw set(), not submitAnswer, so aggregates/answeredCount
// never moves for this template — the answer-node read is the source of truth.)
export function CentralAnalyzeGrid({
  sessionId,
  phase,
}: {
  sessionId: string
  phase: Phase
  config?: unknown
}) {
  const timer = useTimer(sessionId, phase)
  const roster = useAnalyzeRoster(sessionId, phase)
  const submitted = useAnalyzeSubmitted(sessionId, roster, phase.id)
  const answered = roster.filter((r) => submitted[r.writerId]).length
  // A team row's writer is the leader, not the row key.
  const teamUnit = roster.some((r) => r.key !== r.writerId)

  return (
    <CentralInstructionWall
      timer={timer}
      answered={answered}
      total={roster.length}
      unit={teamUnit ? 'tim' : 'pemain'}
      steps={[
        {
          title: 'Analisis Datanya',
          body: 'Baca data yang ditampilkan, lalu jawab setiap pertanyaan analisis untuk timmu.',
          illustration: <GridMock />,
        },
        {
          title: 'Kumpulkan jawabanmu',
          body: 'Jika sudah selesai, klik “Kumpulkan” dan tunggu hingga seluruh pemain selesai.',
          illustration: <SubmitMock />,
        },
      ]}
    />
  )
}
