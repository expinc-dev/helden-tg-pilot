import { useEffect, useRef, useState } from 'react'

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
}: {
  content: PresentationContent
  role: Role
  sessionId: string
  phaseId: string
  // phase/playerId/teamId are PhaseRouter's uniform per-renderer contract
  // (deliberately not destructured): the watch-only player pane just mirrors
  // the central step, and the host/central screens only need the ids above.
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
  const [jumpOpen, setJumpOpen] = useState(false)
  const prevBoundedRef = useRef(bounded)
  const [transitionDir, setTransitionDir] = useState<'right' | 'left'>('right')

  useEffect(() => {
    if (bounded !== prevBoundedRef.current) {
      setTransitionDir(bounded > prevBoundedRef.current ? 'right' : 'left')
      prevBoundedRef.current = bounded
    }
  }, [bounded])

  useEffect(() => {
    if (role !== 'host' || !canControl) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && bounded < content.slides.length - 1) {
        e.preventDefault()
        setStep(bounded + 1)
      }
      if (e.key === 'ArrowLeft' && bounded > 0) {
        e.preventDefault()
        setStep(bounded - 1)
      }
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const n = Number(e.key) - 1
        if (n < content.slides.length) setStep(n)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [role, canControl, bounded, content.slides.length, setStep])

  if (role === 'player') {
    return <PresentationPlayerPane content={content} sessionId={sessionId} />
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
      className="relative flex items-center justify-between gap-4 border-t px-4 py-3"
      style={{ borderColor: '#353535' }}
    >
      <span className="text-xs text-white/60">
        {bounded + 1} / {content.slides.length}
      </span>
      <button
        type="button"
        onClick={() => setJumpOpen(!jumpOpen)}
        className="rounded border px-2 py-1 text-xs text-white"
        style={{ borderColor: '#353535' }}
      >
        Jump
      </button>
      {jumpOpen && (
        <div
          className="absolute bottom-14 left-4 flex gap-1 rounded border bg-[#1B1B1B] p-2"
          style={{ borderColor: '#353535' }}
        >
          {content.slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setStep(i)
                setJumpOpen(false)
              }}
              className={`size-7 rounded text-xs ${i === bounded ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
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
    <div
      key={slide.id}
      className={`animate-in fade-in flex w-full flex-1 flex-col overflow-hidden duration-200 ${transitionDir === 'right' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'}`}
    >
      <div className="mx-auto flex w-full flex-1 flex-col">
        <StepBody
          stepId={slide.id}
          blocks={slide.blocks}
          header={null}
          answers={{}}
          drafts={{}}
          onDraftChange={() => {}}
          disabled
          fullBleed
          sessionId={sessionId}
          phase={phase}
          playerId={playerId ?? ''}
        />
      </div>
    </div>
  )

  const indicator = (
    <span
      className="fixed top-4 right-4 z-10 rounded-md border px-3 py-1 text-xs text-white/70"
      style={{ borderColor: '#353535', background: 'rgba(8,8,8,0.5)' }}
    >
      {bounded + 1} / {content.slides.length}
    </span>
  )

  if (role === 'central') {
    return (
      <div className="fixed inset-0 flex flex-col" style={bgStyle}>
        {slideView}
        {indicator}
        <FullscreenToggle position="fixed" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={bgStyle}>
      {slideView}
      <FullscreenToggle position="absolute" />
      {controls}
      {indicator}

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
