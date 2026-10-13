import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Icon } from '@iconify/react'
import { toast } from 'sonner'

import { createAdvanceGate } from '@/lib/session/advanceGate'

import { type AdvanceApi, AdvanceContext } from './advanceGateContext'

// An advance that settles within this window needs no spinner: a full-screen
// flash on a fast link is noise. Taps are blocked from the first millisecond
// either way — only the overlay waits.
const OVERLAY_DELAY_MS = 700

const MOVING_TEXT = 'Memindahkan ke tahap berikutnya…'

type Advance = { phaseId: string; fn: () => Promise<unknown> }

// Owns the host's advance gate (see lib/session/advanceGate.ts for why) and the
// feedback the host was missing: advance controls disable while it runs, and on
// a slow link a "Memindahkan…" overlay explains the wait instead of leaving a
// screen that looks like the tap was lost.
export function AdvanceGateProvider({ children }: { children: ReactNode }) {
  const [gate] = useState(() => createAdvanceGate())
  const [busy, setBusy] = useState(false)
  const [locked, setLocked] = useState(false)
  const [slow, setSlow] = useState(false)
  // Bumped by the re-check timer so its effect runs again even when busy/locked
  // did not change (e.g. a second pointer change restarted the dwell).
  const [tick, setTick] = useState(0)
  // One auto-advance that was refused (another advance was still settling) and
  // is replayed when the gate frees up. Latest wins; dropped if its phase is no
  // longer the live one.
  const pendingAuto = useRef<Advance | null>(null)

  const sync = useCallback(() => {
    setBusy(gate.busy())
    setLocked(gate.locked())
  }, [gate])

  // Time alone can change the gate's answer — the dwell running out, or a hung
  // advance going stale — and neither fires an event, so re-check on a timer, and
  // keep re-checking until the gate says nothing is pending.
  useEffect(() => {
    const wait = gate.nextCheckInMs()
    if (wait === null) return
    const id = setTimeout(() => {
      sync()
      setTick((n) => n + 1)
    }, wait + 20)
    return () => clearTimeout(id)
  }, [busy, locked, tick, gate, sync])

  useEffect(() => {
    if (!busy) return
    const id = setTimeout(() => setSlow(true), OVERLAY_DELAY_MS)
    return () => {
      clearTimeout(id)
      setSlow(false)
    }
  }, [busy])

  // Filled by an effect below so the settle handler can start the replayed
  // advance through the same function without a self-reference (which react-hooks
  // forbids) and without giving run() an unstable identity — the lobby's
  // auto-advance effects depend on it.
  const launchRef = useRef<(token: number, advance: Advance) => void>(() => {})

  const launch = useCallback(
    (token: number, { phaseId, fn }: Advance) => {
      // The gate stays closed until the advance has fully SETTLED — not merely
      // until the pointer is seen to move: Firebase fires the local listener the
      // instant the pointer is written, while nextPhase is still opening the new
      // phase. A rejection also lands here, so a failed advance can be retried.
      Promise.resolve()
        .then(fn)
        .then(
          (result) => {
            if (result === null || typeof result !== 'object') return
            if ('stale' in result) {
              // nextPhase refused: the pointer is no longer on the phase this tap
              // was for. The screen is about to catch up; say why the tap did
              // nothing.
              toast.info('Sesi sudah berpindah tahap. Layar akan menyesuaikan.')
            } else if ('openFailed' in result) {
              // The session DID move on; only the new phase's set-up failed. Not a
              // failed advance, so don't tell the host to retry it.
              toast.warning(
                'Tahap sudah berpindah, tetapi sebagian pengaturannya gagal dimuat. Periksa layar sebelum melanjutkan.'
              )
            }
          },
          (e: unknown) => {
            console.error('advance failed for', phaseId, e)
            toast.error('Gagal berpindah ke tahap berikutnya. Silakan coba lagi.')
          }
        )
        .finally(() => {
          gate.release(token)
          sync()
          // Replay the refused auto-advance, if any, now that the gate is free.
          // tryStart itself rejects it when its phase is no longer the live one.
          const pending = pendingAuto.current
          if (!pending) return
          pendingAuto.current = null
          const next = gate.tryStart(pending.phaseId, 'auto')
          if (next === null) return
          sync()
          launchRef.current(next, pending)
        })
    },
    [gate, sync]
  )

  useEffect(() => {
    launchRef.current = launch
  }, [launch])

  const run = useCallback<AdvanceApi['run']>(
    (phaseId, fn, source = 'manual') => {
      if (!phaseId) return false
      const token = gate.tryStart(phaseId, source)
      if (token === null) {
        // An auto-advance is not a human tap that can simply be repeated: if it
        // was only held back by another advance still settling, keep it.
        if (source === 'auto') pendingAuto.current = { phaseId, fn }
        return false
      }
      sync()
      launch(token, { phaseId, fn })
      return true
    },
    [gate, sync, launch]
  )

  const observe = useCallback<AdvanceApi['observe']>(
    (phaseId) => {
      gate.observe(phaseId)
      sync()
    },
    [gate, sync]
  )

  const api = useMemo<AdvanceApi>(() => ({ run, observe, locked }), [run, observe, locked])

  return (
    <AdvanceContext.Provider value={api}>
      {children}
      {/* Always mounted so assistive tech registers the live region BEFORE its
          text changes; a region inserted together with its text is often not
          announced. */}
      <div role="status" aria-live="polite" className="sr-only">
        {busy && slow ? MOVING_TEXT : ''}
      </div>
      {busy && slow && <AdvancingOverlay />}
    </AdvanceContext.Provider>
  )
}

function AdvancingOverlay() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-black/70 px-8 text-center backdrop-blur-sm"
    >
      <Icon icon="mdi:loading" className="text-helden-yellow size-10 animate-spin" />
      <p className="text-lg font-semibold text-white">{MOVING_TEXT}</p>
      <p className="text-sm text-white/70">Mohon tunggu, jangan tekan tombol lagi.</p>
    </div>
  )
}
