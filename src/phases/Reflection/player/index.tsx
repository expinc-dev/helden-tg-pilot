import { useEffect, useState } from 'react'

import { assets } from '@/assets'
import { GradientButton } from '@/components/GradientButton'
import { Icon } from '@iconify/react'
import { onValue, ref } from 'firebase/database'

import { rtdb } from '@/lib/firebase'
import { submitAnswer } from '@/lib/sync/submitAnswer'

import type { ReflectionAnswer, ReflectionContent } from '../lib'

// Fixed 1-5 mood scale — the schema only carries a start/end label pair, but
// the design calls for a distinct icon + label per step, so these are UI-only
// constants rather than content-driven.
const MOOD_OPTIONS = [
  { value: 1, label: 'Tidak Menyenangkan', icon: 'mdi:emoticon-sad-outline', color: '#FF5A5A' },
  {
    value: 2,
    label: 'Kurang Menyenangkan',
    icon: 'mdi:emoticon-confused-outline',
    color: '#FF9A3D',
  },
  { value: 3, label: 'Biasa Saja', icon: 'mdi:emoticon-neutral-outline', color: '#FFD93D' },
  { value: 4, label: 'Menyenangkan', icon: 'mdi:emoticon-happy-outline', color: '#8BD450' },
  {
    value: 5,
    label: 'Sangat Menyenangkan',
    icon: 'mdi:emoticon-excited-outline',
    color: '#26890C',
  },
] as const

// Open-text + 1-5 scale, no timer, explicit submit. Nothing is written per
// keystroke — the whole answer lands on the player's own node
// (players/{id}/answers/{phaseId}) in one shot when they tap Selanjutnya.
export function PlayerReflection({
  content,
  title,
  sessionId,
  phaseId,
  playerId,
}: {
  content: ReflectionContent
  title: string
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
      <ReflectionShell title={title}>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#26890C]/20">
            <Icon icon="mdi:check-circle" className="size-10 text-[#26890C]" />
          </div>
          <p className="text-xl font-semibold text-white">Terima kasih atas refleksimu!</p>
          <p className="text-white/40">Menunggu fase berikutnya...</p>
        </div>
      </ReflectionShell>
    )
  }

  return (
    <ReflectionShell
      title={title}
      subtitle={content.prompt}
      footer={
        <SubmitButton disabled={!canSubmit} onClick={handleSubmit}>
          Selanjutnya
        </SubmitButton>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div
          className="flex min-h-0 flex-1 flex-col rounded-lg border p-4"
          style={{ borderColor: '#353535', background: 'rgba(0, 0, 0, 0.08)' }}
        >
          <CardHeading
            heading={
              content.openText.label || 'Apa pelajaran yang bisa kau ambil dari permainan ini?'
            }
            subtext="Ceritakan dengan kata-katamu sendiri"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, content.openText.maxLen))}
            maxLength={content.openText.maxLen}
            placeholder="Tulis refleksimu di sini..."
            className="mt-3 min-h-0 w-full flex-1 resize-none rounded-lg border p-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
            style={{ borderColor: '#353535', background: 'rgba(255, 255, 255, 0.04)' }}
          />
          <p className="mt-2 text-right text-xs text-white/40">
            {text.length}/{content.openText.maxLen} Karakter
          </p>
        </div>

        <div
          className="rounded-lg border p-4"
          style={{ borderColor: '#353535', background: 'rgba(0, 0, 0, 0.08)' }}
        >
          <CardHeading
            heading={content.scale.label || 'Seberapa menyenangkan permainan ini?'}
            subtext="Pilih satu yang paling sesuai dengan pengalamanmu"
          />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {MOOD_OPTIONS.map((mood) => {
              const selected = scale === mood.value
              return (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setScale(mood.value)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition"
                  style={{
                    borderColor: selected ? '#FFB800' : '#353535',
                    backgroundColor: selected ? `${mood.color}26` : 'transparent',
                    opacity: selected ? 1 : 0.64,
                  }}
                >
                  <Icon icon={mood.icon} className="size-7" style={{ color: mood.color }} />
                  <span
                    className={`text-xs leading-[120%] tracking-[-0.48px] ${selected ? 'font-semibold text-white' : 'font-normal text-[#CCC]'}`}
                  >
                    {mood.label}
                  </span>
                </button>
              )
            })}
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
  title,
  subtitle,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div
      className="flex min-h-dvh flex-col gap-4 bg-cover bg-top p-4 sm:p-6"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
            {subtitle && <p className="mx-auto mt-2 max-w-md text-sm text-white/60">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
      {footer}
    </div>
  )
}

// A short accent tick + heading + helper subtext — the per-card title
// language used inside each Reflection card.
function CardHeading({ heading, subtext }: { heading: string; subtext?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-base font-bold text-[#FFB800]">{heading}</h2>
      {subtext && <p className="text-xs text-white/50">{subtext}</p>}
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
