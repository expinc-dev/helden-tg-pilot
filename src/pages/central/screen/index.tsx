import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { EndScreen } from '@/pages/extra/end-screen'
import type { Phase } from '@helden-inc/tg-schema'

import { PhaseRouter } from '@/phases/PhaseRouter'
import { TimerBar } from '@/phases/TimerBar'

import { demoBundle } from '@/lib/demoBundle'
import { loadIdentity, saveIdentity, saveLastSession } from '@/lib/identity'
import { newId } from '@/lib/ids'
import { joinPresence } from '@/lib/session/presence'
import { usePhasePointer } from '@/lib/sync/usePhasePointer'
import { useSessionConfig, useSessionMeta } from '@/lib/sync/useSession'

import { WaitingScreen } from './WaitingScreen'

type Identity = { id: string; isNew: boolean }

export function CentralView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const meta = useSessionMeta(sessionId)
  const config = useSessionConfig(sessionId)
  const pointer = usePhasePointer(sessionId)

  const [identity] = useState<Identity>(() => {
    const stored = sessionId ? loadIdentity(sessionId, 'central') : null
    if (stored) return { id: stored.id, isNew: false }
    const id = newId('c')
    if (sessionId) saveIdentity(sessionId, 'central', { id })
    return { id, isNew: true }
  })

  // Remember "this is the session I'm in" so JoinGate can offer Rejoin instantly,
  // before anyone types a code — separate from the identity itself.
  useEffect(() => {
    if (sessionId) saveLastSession('central', sessionId)
  }, [sessionId])

  const [full, setFull] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    let leave = () => {}
    let cancelled = false
    joinPresence(sessionId, 'central', identity.id, { isNew: identity.isNew }).then((r) => {
      if (r.ok) {
        // StrictMode remount: skip leave() when cancelled — mount2 has already
        // written connected:true, and firing update({connected:false}) here would
        // race-overwrite it, stranding the host at 0/N. onDisconnect handles the
        // real tab-close case.
        if (!cancelled) leave = r.leave
      } else if (!cancelled) setFull(true)
    })
    return () => {
      cancelled = true
      leave()
    }
  }, [sessionId, identity])

  const phase = pointer ? demoBundle.phases[pointer.activePhaseId] : null

  if (full) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-sm text-red-600">Session is full — no central-screen slots left.</p>
      </div>
    )
  }

  if (meta?.status === 'ended' && sessionId) return <EndScreen sessionId={sessionId} />

  // Full-bleed phases escape the standard live wrapper's padding: idle's
  // lobby-style layout, team_selfie's wall-filling photo mosaic (HLN-018), and
  // doubt_seed's gallery (HLN-003). Same reasoning as the host's video bypass.
  if (phase && sessionId && isFullBleedPhase(phase)) {
    return (
      <PhaseRouter
        phase={phase}
        phaseStartMs={pointer?.changedAt}
        role="central"
        sessionId={sessionId}
        allowTeams={config?.allowTeams}
      />
    )
  }

  if (phase && sessionId) {
    return (
      <div className="flex min-h-screen flex-col gap-4 bg-[#121212] p-8">
        <TimerBar sessionId={sessionId} phase={phase} role="central" />
        <PhaseRouter
          phase={phase}
          phaseStartMs={pointer?.changedAt}
          role="central"
          sessionId={sessionId}
          allowTeams={config?.allowTeams}
        />
      </div>
    )
  }

  return <WaitingScreen sessionId={sessionId} joinCode={config?.joinCode} />
}

// Phases that own the whole viewport. Kept as one predicate so the two bypass
// call sites can never drift apart.
function isFullBleedPhase(phase: Phase): boolean {
  if (phase.content.type === 'idle') return true
  if (phase.content.type === 'end') return true
  // microlearning's central view is a full-bleed question wall with its own
  // timer band, so it must not sit inside the padded wrapper + TimerBar pill.
  if (phase.content.type === 'microlearning') return true
  return (
    phase.content.type === 'minigame' &&
    (phase.content.templateId === 'team_selfie' ||
      phase.content.templateId === 'doubt_seed' ||
      // form_to_prompt (HLN-005) is one large instruction card + a count for the
      // room to read while they work. Inside the standard wrapper the 48px
      // padding plus the timer bar would push its own min-h-dvh layout past a
      // viewport, so it takes the wall like the other two.
      phase.content.templateId === 'form_to_prompt' ||
      // commitment (HLN-014) is the same shape as form_to_prompt — the
      // instruction plus a bare "berapa yang sudah mengirim" — read by the whole
      // room in the last minutes of the day. Same reason it takes the wall.
      //
      // journey is deliberately NOT here. Its central branch renders null: the
      // wall's "Perjalananmu" is an authored `content` phase (the storyboard's
      // copy is fixed, with no participant data in it), so a journey minigame
      // phase on the wall would be an authoring mistake rather than a layout
      // decision. Giving it the full viewport would only make that mistake
      // bigger.
      phase.content.templateId === 'commitment')
  )
}
