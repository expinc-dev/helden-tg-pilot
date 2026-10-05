import { useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PlayerScreenFrame } from '@/components/PlayerScreenFrame'
import { Icon } from '@iconify/react'
import { onValue } from 'firebase/database'

import { ActionButton } from '@/phases/Microlearning/PlayerPane/shared'

import { eref } from '@/lib/firebase'
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
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  // Reconnect recovery: if this player already submitted, land them straight
  // on the "thanks" screen instead of a blank form.
  useEffect(() => {
    return onValue(
      eref(`sessions/${sessionId}/players/${playerId}/answers/${phaseId}`),
      (s) => {
        const val = s.val()
        if (val?.value) setSubmitted(val.value as ReflectionAnswer)
      },
      { onlyOnce: true }
    )
  }, [sessionId, playerId, phaseId])

  // The icons are fixed, but their names come from the authored end labels
  // (the question may be about importance, not enjoyment).
  const scaleLabel = (v: number) =>
    v === 1
      ? (content.scale.labels?.[0] ?? String(v))
      : v === 5
        ? (content.scale.labels?.[1] ?? String(v))
        : String(v)

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
        <ActionButton disabled={!canSubmit} onClick={() => setConfirmSubmit(true)}>
          Selanjutnya
        </ActionButton>
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
                  aria-label={scaleLabel(mood.value)}
                  title={scaleLabel(mood.value)}
                  className="flex items-center justify-center rounded-lg border p-3 transition"
                  style={{
                    borderColor: selected ? '#FFB800' : '#353535',
                    backgroundColor: selected ? `${mood.color}26` : 'transparent',
                    opacity: selected ? 1 : 0.64,
                  }}
                >
                  <Icon icon={mood.icon} className="size-10" style={{ color: mood.color }} />
                </button>
              )
            })}
          </div>
          {content.scale.labels && (
            <div className="mt-2 flex justify-between gap-4 text-xs text-white/50">
              <span>{content.scale.labels[0]}</span>
              <span className="text-right">{content.scale.labels[1]}</span>
            </div>
          )}
        </div>
      </div>
      {confirmSubmit && (
        <ConfirmDialog
          title="Apakah kamu yakin?"
          message="Jawaban yang sudah dikirim tidak bisa diubah lagi."
          confirmLabel="Ya, kirim"
          cancelLabel="Periksa lagi"
          onCancel={() => setConfirmSubmit(false)}
          onConfirm={() => {
            setConfirmSubmit(false)
            void handleSubmit()
          }}
        />
      )}
    </ReflectionShell>
  )
}

// Shared player frame (app bar + bordered panel + action button below), same
// as Microlearning and the quiz screens. The phase title is host-only.
function ReflectionShell({
  children,
  footer,
  subtitle,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  title?: string
  subtitle?: string
}) {
  return (
    <PlayerScreenFrame panelClassName="gap-5 p-4" footer={footer}>
      {subtitle && (
        <p className="text-xl leading-[1.3] font-medium tracking-[-0.04em] text-[#ccc]">
          {subtitle}
        </p>
      )}
      {children}
    </PlayerScreenFrame>
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
