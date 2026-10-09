import { CentralInstructionWall } from '@/components/CentralInstructionWall'
import { SortMock, SubmitMock } from '@/components/instructionMocks'
import type { Phase } from '@helden-inc/tg-schema'

import { useTimer } from '@/lib/sync/useTimer'

import { isTeamMode, useRoundState, useSortOrderAnswers, useSortOrderRoster } from '../lib'
import type { SortOrderConfig } from '../score'

// Central for sort_order (Figma instruction wall): how to play + timer + a bare
// "n dari m telah menjawab". The correct order and every player's answer are
// deliberately NOT projected on the wall (the host runs the debrief from the host
// screen). The player writes a raw set() under answers/{phaseId}/rounds/{round}, so
// aggregates/answeredCount never moves — count the roster's answer nodes instead.
export function CentralSortOrder({
  sessionId,
  phase,
  config,
}: {
  sessionId: string
  phase: Phase
  config?: SortOrderConfig
}) {
  const timer = useTimer(sessionId, phase)
  const roster = useSortOrderRoster(sessionId, phase)
  const { round } = useRoundState(sessionId, phase.id)
  const answers = useSortOrderAnswers(sessionId, roster, phase.id, round)
  const answered = roster.filter((r) => answers[r.writerId]).length
  const n = config?.items.length

  return (
    <CentralInstructionWall
      timer={timer}
      answered={answered}
      total={roster.length}
      unit={isTeamMode(phase) && roster.some((r) => r.key !== r.writerId) ? 'tim' : 'pemain'}
      steps={[
        {
          title: 'Masukkan Hasil',
          body: `Tarik dan susun pilihan hingga menjadi urutan yang tepat${n ? `, dari nomor 1 sampai ${n}` : ''}.`,
          illustration: <SortMock />,
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
