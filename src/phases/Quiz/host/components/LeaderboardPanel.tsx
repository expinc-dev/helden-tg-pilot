import { Modal } from '@/components/Modal'
import type { Phase } from '@helden-inc/tg-schema'

import { LeaderboardRows } from '../../components/LeaderboardRows'
import { type QuizContent } from '../../lib'

// Same centered <Modal> shell as ConfirmDialog, just wider — the row list
// (LeaderboardRows) is shared verbatim with central's full-bleed LeaderboardScreen.
export function LeaderboardPanel({
  sessionId,
  phase,
  content,
  onClose,
}: {
  sessionId: string
  phase: Phase
  content: QuizContent
  onClose: () => void
}) {
  return (
    <Modal title="Leaderboard" onClose={onClose} maxWidthClassName="max-w-3xl">
      <div className="-m-5">
        <LeaderboardRows sessionId={sessionId} phase={phase} content={content} />
      </div>
    </Modal>
  )
}
