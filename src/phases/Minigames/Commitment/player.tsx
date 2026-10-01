import { useState } from 'react'

import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

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

  return (
    <div className="flex min-h-dvh flex-col bg-[#1F1F1F] p-4 text-white sm:p-6">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex flex-col items-center gap-1 pb-5 text-center">
          <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
        </div>

        {submittedSentence !== null ? (
          <DonePane sentence={submittedSentence} doneCopy={config.doneCopy} />
        ) : (
          <div className="flex flex-col gap-5 pb-6">
            {config.instructions && (
              <p className="text-sm leading-6 whitespace-pre-line text-white/70">
                {config.instructions}
              </p>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-white/80">{config.actionLabel}</span>
              <textarea
                rows={2}
                value={action}
                placeholder={config.actionPlaceholder}
                onChange={(e) => setAction(e.target.value)}
                className="resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white transition placeholder:text-white/25 placeholder:italic focus:border-[#FFB800] focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-white/80">{config.reasonLabel}</span>
              <textarea
                rows={2}
                value={reason}
                placeholder={config.reasonPlaceholder}
                onChange={(e) => setReason(e.target.value)}
                className="resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white transition placeholder:text-white/25 placeholder:italic focus:border-[#FFB800] focus:outline-none"
              />
            </label>

            {/* Live, per keystroke: the participant is meant to read their own
                commitment back and notice when it says something they did not
                mean. `pre` + wrap so the authored pattern's punctuation and an
                accidental blank slot both show exactly as they will be stored. */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50">Komitmenmu</span>
              <pre className="rounded-lg border border-white/15 bg-black/40 p-3 text-sm leading-6 whitespace-pre-wrap text-white">
                {sentence}
              </pre>
            </div>

            <button
              type="button"
              disabled={!canSubmit || busy}
              onClick={() => void submit()}
              className="w-full rounded-lg bg-[#FFB800] py-3.5 text-center text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white disabled:opacity-50"
            >
              {busy ? 'Mengirim…' : 'Simpan komitmenku'}
            </button>

            {!canSubmit && (
              <p className="text-xs text-white/40">
                Isi dua-duanya — langkahnya, dan alasannya. Kalimatnya baru lengkap kalau keduanya
                ada.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
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
