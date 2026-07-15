import { useEffect, useState } from 'react'

export type SlideTimerDirection = 'down' | 'up'

// A presentation slide's optional timer, as authored in demoBundle.ts's
// presentationSlideExtras (NOT part of the @helden-inc/tg-schema
// PresentationSlide type — see that file for why). `direction` only changes
// which number is shown; both directions are "done" once `seconds` elapse.
export type SlideTimerConfig = { seconds: number; direction?: SlideTimerDirection }

export type SlideTimerState =
  | { active: false }
  | {
      active: true
      direction: SlideTimerDirection
      seconds: number
      remainingSec: number
      elapsedSec: number
      expired: boolean
    }

// LOCAL, not server-authoritative — unlike every other timer in this app
// (useTimer.ts's phase timers), this one does NOT write to RTDB. It was
// originally built that way (sessions/{id}/centralStepTimer, mirroring
// openPhaseTimer's offset-corrected endsAt pattern exactly), but the
// deployed database rules reject writes to that new path with
// permission_denied — this repo's database.rules.json was removed in an
// earlier restructure, so rules now live only in the Firebase console,
// unreachable from here. Fixing that properly means adding a rule for
// sessions/{id}/centralStepTimer in the console (mirroring whatever already
// permits sessions/{id}/centralStep) and reverting this hook to the
// server-authoritative version in git history.
//
// Until then: every device (host, central) already receives the SAME
// `activeSlideId` at nearly the same instant, via the centralStep sync that
// already works. So instead of a shared endsAt, each device independently
// counts its OWN elapsed ticks from the moment ITS listener sees the slide
// change. Devices converge to within ordinary Firebase realtime latency
// (well under a second in practice) — not millisecond-exact, but the
// confirm-before-advance UX this gates on only needs a threshold check ("has
// ~N seconds passed"), not frame-perfect sync, so this is an acceptable
// approximation, not a hack papering over a correctness bug.
//
// Implementation note: `elapsedSec` only updates from inside the 250ms
// interval's own callback (React's accepted "subscribe to an external clock"
// effect shape) — never assigned synchronously in an effect body, and
// `Date.now()` never touches the render path, since both are disallowed by
// this repo's react-hooks purity rules. One side effect: for up to one tick
// (<250ms) right after landing on a new timed slide, `elapsedSec` can still
// show the previous slide's last value before the first tick corrects it —
// a harmless, self-healing display quirk, not a state bug.
export function useSlideTimer(
  slideId: string,
  config: SlideTimerConfig | undefined
): SlideTimerState {
  const [elapsedSec, setElapsedSec] = useState(0)

  useEffect(() => {
    if (!config) return
    let ticks = 0
    const h = setInterval(() => {
      ticks += 1
      setElapsedSec(Math.min(config.seconds, Math.floor((ticks * 250) / 1000)))
    }, 250)
    return () => clearInterval(h)
  }, [config, slideId])

  if (!config || config.seconds <= 0) return { active: false }

  const clampedElapsed = Math.min(elapsedSec, config.seconds)
  return {
    active: true,
    direction: config.direction ?? 'down',
    seconds: config.seconds,
    remainingSec: config.seconds - clampedElapsed,
    elapsedSec: clampedElapsed,
    expired: clampedElapsed >= config.seconds,
  }
}
