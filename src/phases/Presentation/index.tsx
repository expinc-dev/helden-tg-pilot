import { useEffect, useRef, useState } from 'react'

import { FullscreenToggle } from '@/components/FullscreenToggle'
import { GradientButton } from '@/components/GradientButton'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { StepBody } from '@/phases/Microlearning/PlayerPane/StepBody'

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
    if (!jumpOpen) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setJumpOpen(false)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [jumpOpen])

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

  const controls = role === 'host' && (
    <div className="relative z-50 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-black/40 p-3 sm:p-4">
      {/* Figma "Slides 1/5" counter + an explicit Jump button (the counter alone
          did not read as clickable, so the jump-to-slide list was effectively lost). */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <p className="text-base font-light tracking-[-0.04em] text-[#fddb00] sm:text-lg">
          Slides {bounded + 1}
          <span className="font-bold">/{content.slides.length}</span>
        </p>
        <button
          type="button"
          disabled={!canControl}
          aria-expanded={jumpOpen}
          onClick={() => setJumpOpen(!jumpOpen)}
          className="flex h-10 items-center gap-2 rounded-lg bg-[#1b1b1b] px-4 text-base font-medium tracking-[-0.04em] text-white disabled:opacity-40 sm:text-lg"
        >
          <Icon icon="mdi:format-list-numbered" className="size-5 text-[#fddb00]" />
          Jump
        </button>
      </div>
      {jumpOpen && (
        <>
          {/* Click-away layer: closes the list without choosing a slide. */}
          <button
            type="button"
            aria-label="Tutup daftar slide"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setJumpOpen(false)}
          />
          <div
            className="absolute bottom-full left-3 z-50 mb-2 flex max-w-[calc(100%-2rem)] flex-wrap gap-2 rounded-lg border bg-[#1B1B1B] p-3 sm:left-4"
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
                className={`size-9 rounded text-sm font-medium ${i === bounded ? 'bg-[#fddb00] text-black' : 'bg-white/10 text-white'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <button
          type="button"
          disabled={!canControl || bounded === 0}
          onClick={() => setStep(bounded - 1)}
          className="h-10 min-w-0 flex-1 rounded-lg bg-[#1b1b1b] text-base font-medium tracking-[-0.04em] text-white disabled:opacity-40 sm:w-[132px] sm:flex-none sm:text-lg"
        >
          Previous
        </button>
        {/* Last slide has no phase-advance button on purpose: the host shell owns
            the single "Tahap Selanjutnya" control (with confirm). */}
        <GradientButton
          disabled={!canControl || isLastSlide}
          onClick={() => setStep(bounded + 1)}
          className="h-10 min-w-0 flex-1 px-4 text-base font-medium! tracking-[-0.04em] sm:flex-none sm:px-8 sm:text-lg"
        >
          Next
        </GradientButton>
      </div>
    </div>
  )

  // The projected slide is the content here, so it gets a flat dark surface.
  // Deliberately NOT the lobby backdrop (`backgrounds.central`): that PNG is
  // drawn out of ASCII-art character fields, and its bottom-left cluster leaked
  // through the strip under the slide's below-image title as garbled lettering
  // ("frnxxx..."). Same near-black as the hero image's own bottom fade, so the
  // seam between image and surface stays invisible.
  const bgStyle = { backgroundColor: '#121212' }

  const slideView = (
    <div
      key={slide.id}
      className={`animate-in fade-in flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden duration-200 ${transitionDir === 'right' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'}`}
    >
      <div className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto">
        <StepBody
          stepId={slide.id}
          // Inert — presentation slides always hard-fail publish if they carry
          // a question block (see helden-tg-cms's registry.ts publishValidate),
          // so no BlockView here ever actually reaches a 'question' branch that
          // would read the qId this builds. slide.id is a reasonable stand-in,
          // same spirit as PathQuestion.tsx's own inert task-content qId.
          microStepId={slide.id}
          blocks={slide.blocks}
          header={null}
          answers={{}}
          drafts={{}}
          onDraftChange={() => {}}
          // `disabled` freezes answer input only — QuestionView is unreachable
          // here per the publish guard above. `button` blocks ignore it, so a
          // projected slide can carry a live copy / open-Gemini button.
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

  // Host branch: in-flow flex child of the host live shell (pages/host/lobby),
  // NOT an absolutely-positioned overlay. `absolute inset-0` resolved against
  // that middle band and let the slide paint outside its container; `h-full
  // min-h-0` keeps it inside while central keeps its own `fixed inset-0` deck.
  return (
    <div
      className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
      style={bgStyle}
    >
      {slideView}
      {/* No fullscreen toggle here: the host live shell already renders Header's. */}
      {controls}
    </div>
  )
}
