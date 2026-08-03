import { Modal } from '@/components/Modal'

import { PlayerAnswerRows } from '../../components/PlayerAnswerRows'
import { type SortOrderAnswer, type SortOrderParticipant } from '../../lib'
import type { SortOrderConfig } from '../../score'

export function PlayerAnswersPanel({
  roster,
  answers,
  config,
  values,
  onClose,
}: {
  roster: SortOrderParticipant[]
  answers: Record<string, SortOrderAnswer | undefined>
  config: SortOrderConfig
  values: Record<string, number>
  onClose: () => void
}) {
  return (
    <Modal title="Jawaban Pemain" onClose={onClose} maxWidthClassName="max-w-2xl">
      <PlayerAnswerRows
        roster={roster}
        answers={answers}
        config={config}
        values={values}
        accent="#FFB800"
      />
    </Modal>
  )
}
