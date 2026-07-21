import { useEffect, useState } from 'react'

import { assets } from '@/assets'
import { GradientButton } from '@/components/GradientButton'
import { Icon } from '@iconify/react'
import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'
import { submitAnswer } from '@/lib/sync/submitAnswer'

import type { ReflectionAnswer, ReflectionContent } from '../lib'

// Open-text + 1-5 scale, no timer, explicit submit. Nothing is written per
// keystroke — the whole answer lands on the player's own node
// (players/{id}/answers/{phaseId}) in one shot when they tap Kirim.
export function PlayerReflection({
  content,
  sessionId,
  phaseId,
  playerId,
}: {
  content: ReflectionContent
  sessionId: string
  phaseId: string
  playerId: string
}) {
  const [text, setText] = useState('')
  const [scale, setScale] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState<ReflectionAnswer | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Reconnect recovery: if this player already submitted, land them straight
  // on the "thanks" screen instead of a blank form.
  useEffect(() => {
    return onValue(
      ref(rtdb, `sessions/${sessionId}/players/${playerId}/answers/${phaseId}`),
      (s) => {
        const val = s.val()
        if (val?.value) setSubmitted(val.value as ReflectionAnswer)
      },
      { onlyOnce: true }
    )
  }, [sessionId, playerId, phaseId])

  const canSubmit = !submitted && !submitting && text.trim().length > 0 && scale !== null

  const handleSubmit = async () => {
    if (!canSubmit || scale === null) return
    setSubmitting(true)
    const value: ReflectionAnswer = { text: text.trim(), scale }
    await submitAnswer({ sessionId, playerId, keyId: playerId, qId: phaseId, value })
    setSubmitted(value)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <ReflectionShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#26890C]/20">
            <Icon icon="mdi:check-circle" className="size-10 text-[#26890C]" />
          </div>
          <p className="text-xl font-semibold text-white">Terima kasih atas refleksimu!</p>
          <p className="text-white/40">Menunggu fase berikutnya...</p>
        </div>
      </ReflectionShell>
    )
  }

  const steps = content.scale.max - content.scale.min + 1

  return (
    <ReflectionShell
      footer={
        <SubmitButton disabled={!canSubmit} onClick={handleSubmit}>
          Kirim
        </SubmitButton>
      }
    >
      <div className="flex flex-col gap-6">
        <SectionHeading text={content.prompt} />

        <div className="flex flex-col gap-3">
          {content.openText.label && (
            <p className="text-sm text-white/60">{content.openText.label}</p>
          )}
          <div className="rounded-xl border border-white/10 bg-[#1C1C1E] p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, content.openText.maxLen))}
              maxLength={content.openText.maxLen}
              rows={5}
              placeholder="Tulis refleksimu di sini..."
              className="w-full resize-none text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            <p className="mt-2 text-right text-xs text-white/40">
              {text.length}/{content.openText.maxLen}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {content.scale.label && <p className="text-sm text-white/60">{content.scale.label}</p>}
          <div className="rounded-xl border border-white/10 bg-[#1C1C1E] p-4">
            <div className="flex items-center justify-between gap-2">
              {Array.from({ length: steps }, (_, i) => content.scale.min + i).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScale(n)}
                  className={`flex h-12 flex-1 items-center justify-center rounded-lg border text-lg font-bold transition ${
                    scale === n
                      ? 'border-[#FFB800] bg-[#FFB800] text-black'
                      : 'border-white/10 bg-transparent text-white/70'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {content.scale.labels && (
              <div className="mt-2 flex justify-between text-xs text-white/40">
                <span>{content.scale.labels[0]}</span>
                <span>{content.scale.labels[1]}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ReflectionShell>
  )
}

// Same background-image + rounded/bordered card frame as Microlearning's step
// cards and the host's monitor panes, so a reflection screen doesn't read as
// a different app from the rest of the phases.
function ReflectionShell({
  children,
  footer,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-cover bg-top p-4 sm:p-6"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && <div className="p-4 pt-0 sm:p-6 sm:pt-0">{footer}</div>}
      </div>
    </div>
  )
}

// A short accent tick + heading — same "card title" language used above
// microlearning question prompts, so Reflection's prompt reads the same way.
function SectionHeading({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-1 w-8 rounded-full bg-[#FFB800]" />
      <h2 className="text-lg font-bold text-[#FFB800]">{text}</h2>
    </div>
  )
}

// Flat dark when disabled, gradient when ready — mirrors the app's
// "Selanjutnya" button language (Microlearning's ActionButton) rather than a
// translucent disabled gradient.
function SubmitButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-lg bg-[#2A2A2A] py-3.5 text-center text-sm font-semibold text-white/30"
      >
        {children}
      </button>
    )
  }
  return (
    <GradientButton type="button" onClick={onClick} className="w-full py-3.5 text-sm">
      {children}
    </GradientButton>
  )
}
