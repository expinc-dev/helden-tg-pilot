import { useState } from 'react'

import { assets } from '@/assets'
import { FullscreenToggle } from '@/components/FullscreenToggle'
import { GradientButton } from '@/components/GradientButton'
import type { Phase } from '@helden-inc/tg-schema'

import { StepBody } from '@/phases/Microlearning/PlayerPane/StepBody'

import { demoBundle } from '@/lib/demoBundle'
import { endLevel, nextPhase } from '@/lib/session/control'
import { useCentralStep } from '@/lib/sync/useCentralStep'

import type { Role } from '../PhaseRouter'
import { PresentationPlayerPane } from './PlayerPane'

type PresentationContent = Extract<Phase['content'], { type: 'presentation' }>

export function PresentationRenderer({
  content,
  role,
  sessionId,
  phaseId,
  phase,
  playerId,
  teamId,
}: {
  content: PresentationContent
  role: Role
  sessionId: string
  phaseId: string
  phase: Phase
  playerId?: string
  teamId?: string
}) {
  const [step, setStep] = useCentralStep(sessionId)
  const bounded = Math.min(Math.max(step, 0), content.slides.length - 1)
  const slide = content.slides[bounded]
  const canControl = role === content.controlledBy
  const isLastSlide = bounded === content.slides.length - 1

  const [pendingPhaseEnd, setPendingPhaseEnd] = useState(false)

  if (role === 'player') {
    if (!playerId) return null
    return (
      <PresentationPlayerPane
        content={content}
        sessionId={sessionId}
        phaseId={phaseId}
        playerId={playerId}
        teamId={teamId}
        phase={phase}
      />
    )
  }

  const requestAdvance = (kind: 'slide' | 'phase') => {
    if (kind === 'phase') {
      setPendingPhaseEnd(true)
      return
    }
    setStep(bounded + 1)
  }

  const confirmPhaseEnd = () => {
    setPendingPhaseEnd(false)
    const isModular = (demoBundle.flowMode ?? 'sequential') !== 'sequential'
    void (isModular ? endLevel(sessionId, phaseId) : nextPhase(sessionId, phaseId))
  }

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

  const slideView = (
    <div className="flex w-full flex-1 flex-col overflow-hidden">
      <StepBody
        stepId={slide.id}
        blocks={slide.blocks}
        header={null}
        answers={{}}
        drafts={{}}
        onDraftChange={() => {}}
        disabled
        sessionId={sessionId}
        phase={phase}
        playerId={playerId ?? ''}
        fullBleed
      />
    </div>
  )

  if (role === 'central') {
    return (
      <div className="fixed inset-0 flex flex-col" style={bgStyle}>
        {slideView}
        <FullscreenToggle position="fixed" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={bgStyle}>
      {slideView}
      <FullscreenToggle position="absolute" />
      {controls}

      {pendingPhaseEnd && (
        <PhaseEndConfirm onCancel={() => setPendingPhaseEnd(false)} onConfirm={confirmPhaseEnd} />
      )}
    </div>
  )
}

function PhaseEndConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
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
          <h2 className="font-semibold text-yellow-400">Lanjut ke Fase Berikutnya?</h2>
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
          <p className="text-sm text-white/80">
            Presentasi akan ditutup dan sesi akan lanjut ke fase berikutnya. Tindakan ini tidak bisa
            dibatalkan.
          </p>
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
