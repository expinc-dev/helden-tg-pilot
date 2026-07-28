import { useState } from 'react'

import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { GradientButton } from '@/components/GradientButton'
import type { Phase } from '@helden-inc/tg-schema'

import { demoBundle, presentationSlideExtras } from '@/lib/demoBundle'
import { endLevel, nextPhase } from '@/lib/session/control'
import { useCentralStep } from '@/lib/sync/useCentralStep'
import { useSlideTimer } from '@/lib/sync/useCentralStepTimer'

import type { Role } from '../PhaseRouter'
import { PresentationPlayerPane } from './PlayerPane'
import { SlideSurface } from './SlideSurface'

type PresentationContent = Extract<Phase['content'], { type: 'presentation' }>

export function PresentationRenderer({
  content,
  role,
  sessionId,
  phaseId,
}: {
  content: PresentationContent
  role: Role
  sessionId: string
  phaseId: string
}) {
  const [step, setStep] = useCentralStep(sessionId)
  const bounded = Math.min(Math.max(step, 0), content.slides.length - 1)
  const slide = content.slides[bounded]
  const extras = presentationSlideExtras[slide.id] ?? {}
  const canControl = role === content.controlledBy
  const isLastSlide = bounded === content.slides.length - 1

  const timerState = useSlideTimer(slide.id, extras.timer)
  const timerNotDone = timerState.active && !timerState.expired

  const [pendingAdvance, setPendingAdvance] = useState<'slide' | 'phase' | null>(null)

  if (role === 'player') return <PresentationPlayerPane />

  const requestAdvance = (kind: 'slide' | 'phase') => {
    if (kind === 'phase' || timerNotDone) {
      setPendingAdvance(kind)
      return
    }
    setStep(bounded + 1)
  }

  const confirmAdvance = () => {
    const kind = pendingAdvance
    setPendingAdvance(null)
    if (kind === 'phase') {
      const isModular = (demoBundle.flowMode ?? 'sequential') !== 'sequential'
      void (isModular ? endLevel(sessionId, phaseId) : nextPhase(sessionId, phaseId))
    } else if (kind === 'slide') setStep(bounded + 1)
  }

  const image = slide.blocks.find((b) => b.kind === 'image')?.url

  const controls = role === 'host' && (
    <div
      className="flex items-center justify-between gap-4 border-t px-4 py-3"
      style={{ borderColor: '#353535' }}
    >
      <span className="text-xs text-white/60">
        Slides {bounded + 1}/{content.slides.length}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canControl || bounded === 0}
          onClick={() => setStep(bounded - 1)}
          className="rounded-[8px] border px-4 py-2 text-sm text-white disabled:opacity-40"
          style={{ borderColor: '#353535', background: '#1B1B1B' }}
        >
          Previous
        </button>
        <GradientButton
          disabled={!canControl}
          onClick={() => requestAdvance(isLastSlide ? 'phase' : 'slide')}
          className="px-6 py-2 text-sm"
        >
          {isLastSlide ? 'Next phase' : 'Next'}
        </GradientButton>
      </div>
    </div>
  )

  const bgStyle = {
    backgroundImage: `url(${assets.images.backgrounds.central})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  if (role === 'central') {
    return (
      <div className="fixed inset-0 flex flex-col" style={bgStyle}>
        <SlideSurface image={image} extras={extras} timerState={timerState} role={role} />
        <FullscreenToggle position="fixed" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={bgStyle}>
      <SlideSurface image={image} extras={extras} timerState={timerState} role={role} />
      <FullscreenToggle position="absolute" />
      {controls}

      {pendingAdvance && (
        <AdvanceConfirm
          kind={pendingAdvance}
          timerNotDone={timerNotDone}
          onCancel={() => setPendingAdvance(null)}
          onConfirm={confirmAdvance}
        />
      )}
    </div>
  )
}

function AdvanceConfirm({
  kind,
  timerNotDone,
  onCancel,
  onConfirm,
}: {
  kind: 'slide' | 'phase'
  timerNotDone: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const title = kind === 'phase' ? 'Lanjut ke Fase Berikutnya?' : 'Timer Slide Ini Belum Selesai'
  const message =
    kind === 'phase'
      ? timerNotDone
        ? 'Timer slide ini belum selesai, dan presentasi akan ditutup lalu sesi lanjut ke fase berikutnya. Tindakan ini tidak bisa dibatalkan.'
        : 'Presentasi akan ditutup dan sesi akan lanjut ke fase berikutnya. Tindakan ini tidak bisa dibatalkan.'
      : 'Waktu untuk slide ini belum habis. Lanjut ke slide berikutnya sekarang?'

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-8 backdrop-blur-md">
      <div
        className="w-full max-w-sm overflow-hidden rounded-lg border"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        <div
          className="flex items-center justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: '#353535', background: '#181818' }}
        >
          <h2 className="font-semibold text-yellow-400">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-white/80">{message}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border py-2.5 text-sm text-white"
              style={{ borderColor: '#353535', background: '#1B1B1B' }}
            >
              Batal
            </button>
            <GradientButton type="button" onClick={onConfirm} className="flex-1 py-2.5 text-sm">
              Lanjut
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  )
}
