import { useState } from 'react'

import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'

import { submitCommitmentAnswer } from '@/lib/session/commitment'

import { type CommitmentConfig, assembleCommitment } from './score'

// HLN-014 "Bagian 1" — the closing commitment, on the participant's phone.
//
// One screen, two boxes, and a line that assembles itself between them. There is
// no chooser, no timer and no reveal: this is the last thing written before the
// room goes home, and the storyboard's whole point is that it is taken home
// ("HP: field teks, individual, privat. Dibawa pulang.").
//
// The assembled line sits UNDER the boxes, not above them, because that is the
// order the participant reads their own sentence in — action first, reason
// second — and because a preview above the input pushes the second box below the
// fold on a phone with the keyboard open.
//
// Nothing here is uploaded anywhere but the participant's own answer node. No
// host roster, no central wall of answers, no gallery submission: HLN-014 is the
// one phase in the closing that is explicitly private.
export function CommitmentPlayer({
  phase,
  sessionId,
  writerId,
  config,
}: {
  phase: Phase
  sessionId: string
  writerId: string
  config: CommitmentConfig
}) {
  const phaseId = phase.id

  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [submittedSentence, setSubmittedSentence] = useState<string | null>(null)

  const sentence = assembleCommitment(config.sentenceTemplate, action, reason)
  const canSubmit = !!(action.trim() && reason.trim())

  const submit = async () => {
    if (!canSubmit || busy) return
    setBusy(true)
    try {
      await submitCommitmentAnswer({
        sessionId,
        writerId,
        phaseId,
        answer: { action: action.trim(), reason: reason.trim(), sentence },
      })
      setSubmittedSentence(sentence)
    } finally {
      setBusy(false)
    }
  }

  const field =
    'min-h-24 w-full resize-none rounded-lg border border-[#353535] bg-[#1C1C1E] p-4 text-sm text-white placeholder:text-white/30 focus:border-[#FDDB00] focus:outline-none'

  if (submittedSentence !== null) {
    return (
      <PlayerScreenFrame panelClassName="gap-6 p-4">
        <DonePane sentence={submittedSentence} doneCopy={config.doneCopy} />
      </PlayerScreenFrame>
    )
  }

  // Figma "Lengkapi Komitmen": title + hint, one bordered card holding the two
  // labelled boxes, the action button under the panel.
  return (
    <PlayerScreenFrame
      panelClassName="gap-5 px-4 pt-8 pb-4"
      footer={
        <ActionButton disabled={!canSubmit || busy} onClick={() => void submit()}>
          {busy ? 'Mengirim…' : 'Selanjutnya'}
        </ActionButton>
      }
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-xl leading-[1.2] font-semibold tracking-[-0.04em] text-white">
          Lengkapi Komitmen
        </h2>
        {config.instructions && (
          <p className="text-sm leading-[1.4] tracking-[-0.04em] whitespace-pre-line text-[#ccc]">
            {config.instructions}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-[#353535] p-4">
        <label className="flex flex-col gap-2">
          <span className="text-base tracking-[-0.04em] text-white">{config.actionLabel}</span>
          <textarea
            rows={3}
            value={action}
            placeholder={config.actionPlaceholder}
            onChange={(e) => setAction(e.target.value)}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base tracking-[-0.04em] text-white">{config.reasonLabel}</span>
          <textarea
            rows={3}
            value={reason}
            placeholder={config.reasonPlaceholder}
            onChange={(e) => setReason(e.target.value)}
            className={field}
          />
        </label>
      </div>

      {/* Live, per keystroke: the participant reads their own commitment back
          and notices when it says something they did not mean. */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-white/50">Komitmenmu</span>
        <pre className="rounded-lg border border-[#353535] bg-black/40 p-3 text-sm leading-6 whitespace-pre-wrap text-white">
          {sentence}
        </pre>
      </div>
    </PlayerScreenFrame>
  )
}

// Post-submit. Shows the participant's own sentence back, then the one
// instruction that matters: this is for next Monday, not for the room.
//
// No "lihat yang lain" affordance and no bounce animation celebrating the
// submission — this is private, and there is deliberately nothing to look at.
function DonePane({ sentence, doneCopy }: { sentence: string; doneCopy: string }) {
  return (
    <div className="flex flex-col gap-5 py-6">
      <div className="flex items-center gap-2 text-[#FFB800]">
        <Icon icon="mdi:check-circle-outline" className="size-5" />
        <span className="text-sm font-semibold">Tersimpan</span>
      </div>

      <p className="rounded-lg border border-[#FFB800]/30 bg-[#FFB800]/5 p-4 text-base leading-7 whitespace-pre-wrap text-white">
        {sentence}
      </p>

      {doneCopy && (
        <p className="text-sm leading-6 whitespace-pre-line text-white/50">{doneCopy}</p>
      )}
    </div>
  )
}
