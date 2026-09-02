import type {
  Phase,
  PhasePointer,
  PublishedGame,
  SessionTimer,
  VideoPlayback,
} from '@helden-inc/tg-schema'
import { get, onValue, ref, remove, set, update } from 'firebase/database'

import { normalizeCode } from '@/phases/codecheck'

import { demoBundle } from '@/lib/demoBundle'
import { auth, eref, rtdb } from '@/lib/firebase'

import { flushPhaseResults } from './flush'

// .info/serverTimeOffset is listener-only — get() throws "Invalid token in path".
// Grab it with a one-shot onValue (serverTime − localTime, ms; 0 if unresolved).
// The callback can fire SYNCHRONOUSLY during onValue(), before its return value is
// assigned — so init unsub to a no-op and defer the real unsubscribe to a microtask.
export function serverOffsetOnce(): Promise<number> {
  return new Promise((resolve) => {
    let unsub = () => {}
    let settled = false
    unsub = onValue(ref(rtdb, '.info/serverTimeOffset'), (s) => {
      if (settled) return
      settled = true
      resolve((s.val() as number | null) ?? 0)
      queueMicrotask(() => unsub())
    })
  })
}

// Host-only. On opening a phase, set the single server-authoritative timer node
// (offset-corrected endsAt) if the phase has a server timer, else clear any stale
// one. Written ONCE here — devices only read it. See sync/useTimer.ts.
async function openPhaseTimer(sessionId: string, phase: Phase | undefined) {
  const node = eref(`sessions/${sessionId}/timer`)
  const t = phase?.timer
  if (!phase || !t || t.authority !== 'server' || t.seconds <= 0) {
    await remove(node)
    return
  }
  // Correct the host's local clock against the server before stamping the deadline.
  const offset = await serverOffsetOnce()
  const timer: SessionTimer = { phaseId: phase.id, endsAt: Date.now() + offset + t.seconds * 1000 }
  await set(node, timer)
}

// Host-only. Seeds sessions/{id}/secrets/{phaseId} for graded phase types whose
// answer key must never reach a player's client (BLUEPRINT_schema §7 — the
// Kahoot-style "answer is in the payload" leak). Written ONCE per phase-open,
// here on the host's device, from the SAME demoBundle every client already has
// — the secret itself was never hidden, but after this it's only ever compared
// server-side, inside a database.rules.json .validate rule the player's device
// has no read access to. See phases/CodeInput.tsx for the guess-side of this.
// Quiz answer keys are NOT seeded here: the host grades quiz reveal directly
// from the (full) bundle's question.correctId, and the player-safe bundle
// strips it — so quiz correctness never needs a server-side secret.
async function openPhaseSecrets(sessionId: string, phase: Phase | undefined) {
  if (!phase) return
  if (phase.content.type === 'codeinput') {
    const { expected, caseSensitive } = phase.content
    await set(
      eref(`sessions/${sessionId}/secrets/${phase.id}`),
      normalizeCode(expected, caseSensitive)
    )
  }
}

function requireHostUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('control.ts called before anonymous sign-in resolved')
  return uid
}

// Snapshot of the "played" phase-id set — sessions/{id}/played/{phaseId}: true.
// Host-only write per RTDB rules; readable by everyone. Used by endLevel to
// decide when to auto-end the session.
export async function readPlayedPhases(sessionId: string): Promise<Record<string, true>> {
  const snap = await get(eref(`sessions/${sessionId}/played`))
  return (snap.val() ?? {}) as Record<string, true>
}

// Bundle accessor — pilot loads one static in-memory bundle. When CMS publish
// ships, resolve by sessionId → gameVersionId → Firestore fetch.
function bundle(): PublishedGame {
  return demoBundle
}

// Idle phase = picker resting state in modular flow. Contract: modular bundles
// MUST place an idle phase at phaseOrder[0]; if the first phase is not idle,
// fall back to the first idle phase in the bundle, else the first phase.
function pickerAnchorId(): string {
  const b = bundle()
  const first = b.phases[b.phaseOrder[0]]
  if (first?.type === 'idle') return first.id
  const anyIdle = b.phaseOrder.find((id) => b.phases[id]?.type === 'idle')
  return anyIdle ?? b.phaseOrder[0]
}

// Host-only. Seeds sessions/{id}/videoPlayback for video phases so central and
// host both start from a known "paused at 0" state. Cleared on non-video
// phases to keep a stale playing/paused flag from bleeding across phase types.
async function openPhaseVideoPlayback(sessionId: string, phase: Phase | undefined) {
  const node = eref(`sessions/${sessionId}/videoPlayback`)
  if (!phase || phase.content.type !== 'video') {
    await remove(node)
    return
  }
  const value: VideoPlayback = { state: 'paused', updatedAt: Date.now(), positionSec: 0 }
  await set(node, value)
}

// Host-only. Freeze CodePiece's fragment distribution the moment the phase
// opens — computed once from whoever's rostered RIGHT NOW, ordered by
// joinedAt (stable, already tracked on every player; this is the ordering
// basis BLUEPRINT_runtime left open for T-07, settled here). Room mode: one
// order for the whole session. Team mode (session config's allowTeams, not
// this phase's own teamMode — CodePiece has no leader/member asymmetry, every
// member gets a fragment): one order PER team, computed from that team's own
// roster only. Late joiners after this point don't get a fragment — that's
// what "frozen at phase start" means.
async function openPhaseFragmentOrder(sessionId: string, phase: Phase | undefined) {
  if (!phase || phase.content.type !== 'codepiece') return

  const [playersSnap, teamsSnap, configSnap] = await Promise.all([
    get(eref(`sessions/${sessionId}/players`)),
    get(eref(`sessions/${sessionId}/teams`)),
    get(eref(`sessions/${sessionId}/config`)),
  ])
  const players = (playersSnap.val() ?? {}) as Record<string, { joinedAt?: number } | null>
  const teams = (teamsSnap.val() ?? {}) as Record<
    string,
    { memberIds?: Record<string, true> } | null
  >
  const allowTeams = !!configSnap.val()?.allowTeams
  const byJoinedAt = (a: string, b: string) =>
    (players[a]?.joinedAt ?? 0) - (players[b]?.joinedAt ?? 0)

  if (allowTeams) {
    const patch: Record<string, unknown> = {}
    for (const [teamId, team] of Object.entries(teams)) {
      if (!team) continue
      patch[`teams/${teamId}/codepiece/${phase.id}/fragmentOrder`] = Object.keys(
        team.memberIds ?? {}
      ).sort(byJoinedAt)
    }
    if (Object.keys(patch).length > 0) await update(eref(`sessions/${sessionId}`), patch)
    return
  }

  const order = Object.keys(players).sort(byJoinedAt)
  await set(eref(`sessions/${sessionId}/codepiece/${phase.id}/fragmentOrder`), order)
}

async function openPhase(sessionId: string, phase: Phase | undefined) {
  await Promise.all([
    openPhaseTimer(sessionId, phase),
    openPhaseSecrets(sessionId, phase),
    openPhaseVideoPlayback(sessionId, phase),
    // Caught separately from the others: a permission_denied here (e.g. real
    // deployed rules that predate the codepiece/fragmentOrder path) must not
    // reject this whole Promise.all and silently skip the timer/secrets/
    // videoPlayback writes alongside it — surface it loudly instead so it's
    // debuggable, but let everything else still open normally.
    openPhaseFragmentOrder(sessionId, phase).catch((e) =>
      console.error('openPhaseFragmentOrder failed for', phase?.id, e)
    ),
    remove(eref(`sessions/${sessionId}/centralStep`)),
  ])
}

export async function startSession(sessionId: string) {
  const hostUid = requireHostUid()
  const firstPhase = bundle().phaseOrder[0]
  const pointer: PhasePointer = {
    activePhaseId: firstPhase,
    changedAt: Date.now(),
    changedBy: hostUid,
  }
  await update(eref(`sessions/${sessionId}`), {
    'meta/status': 'live',
    phasePointer: pointer,
  })
  await openPhase(sessionId, bundle().phases[firstPhase])
}

export async function nextPhase(sessionId: string, currentPhaseId: string | undefined) {
  const hostUid = requireHostUid()
  const order = demoBundle.phaseOrder
  const idx = currentPhaseId ? order.indexOf(currentPhaseId) : -1
  const next = order[idx + 1]
  // Flush durable results for the outgoing phase BEFORE the pointer moves —
  // once phasePointer flips, clients navigate away and live/* may be reused.
  // Errors are logged but do not block advance: a failed flush is recoverable
  // (RTDB live/* still intact), a stuck host is not (BLUEPRINT_runtime §11).
  // ponytail: single host writes results; if host crashes mid-flush, a rejoined
  // host can re-flush from live/*. Upgrade path = Cloud Function on phasePointer.
  const outgoing = currentPhaseId ? demoBundle.phases[currentPhaseId] : undefined
  if (outgoing) {
    try {
      await flushPhaseResults(sessionId, outgoing)
    } catch (e) {
      console.error('flushPhaseResults failed for', outgoing.id, e)
    }
    // Sequential flow's counterpart to endLevel's played-marking (modular flow)
    // — without this, sessions/{id}/played stays empty for the whole session
    // and nothing (e.g. the CMS dashboard's completion %) can ever see progress.
    await set(eref(`sessions/${sessionId}/played/${outgoing.id}`), true)
  }
  if (!next) {
    // Last phase done → end the session. Flush already ran above; timer cleared
    // so useTimer doesn't show a stale phase deadline on the end screen.
    await Promise.all([
      update(eref(`sessions/${sessionId}/meta`), { status: 'ended' }),
      remove(eref(`sessions/${sessionId}/timer`)),
    ])
    return { done: true as const }
  }
  const pointer: PhasePointer = { activePhaseId: next, changedAt: Date.now(), changedBy: hostUid }
  await update(eref(`sessions/${sessionId}`), { phasePointer: pointer })
  await openPhase(sessionId, demoBundle.phases[next])
  return { done: false as const, activePhaseId: next }
}

// ─── Modular flow ───────────────────────────────────────────────────────────
// jumpToPhase: host taps a level card on the picker. Sets phasePointer to the
// chosen phase and opens its timer/secrets. Does NOT flush the current phase —
// in modular flow, the current phase is expected to be idle (picker anchor)
// when this is called; if it isn't, the caller (endLevel) has already flushed.
// Host-only via database.rules.json.
export async function jumpToPhase(sessionId: string, phaseId: string) {
  const hostUid = requireHostUid()
  const phase = bundle().phases[phaseId]
  if (!phase) throw new Error(`jumpToPhase: unknown phaseId ${phaseId}`)
  const pointer: PhasePointer = {
    activePhaseId: phaseId,
    changedAt: Date.now(),
    changedBy: hostUid,
  }
  await update(eref(`sessions/${sessionId}`), { phasePointer: pointer })
  await openPhase(sessionId, phase)
}

// Host-only "reveal now" for phases whose reveal gate is the raw server timer
// (SortOrder's isRevealReady is literally `timerExpired` — unlike Quiz, which
// has its own centralStep/stage flag decoupled from the timer). Overwrites
// endsAt to "now" rather than removing the node, so `timer.active` stays true
// and every reader's `expired` flips true on its next tick — removing the node
// instead would make `active` false and `expired` reset to false (see
// useTimer.ts), the opposite of what a manual reveal needs.
export async function forceExpireTimer(sessionId: string) {
  requireHostUid()
  const offset = await serverOffsetOnce()
  await update(eref(`sessions/${sessionId}/timer`), { endsAt: Date.now() + offset })
}

// Testing aid — host-only "replay this phase from scratch" for manual QA, so
// resetting doesn't require creating a new session. Does NOT touch
// phasePointer or played/* — the phase stays the active one, it just looks
// freshly opened.
//
// Deliberately does NOT delete players/{id}/answers/{phaseId} directly:
// database.rules.json scopes every write under players/{id} to that id's
// registered owner (sessions/{id}/playerOwners/{id} === auth.uid, see
// session/presence.ts#claimOwnership) — the host's auth.uid is never that
// owner, so a host-side remove() 403s. Instead this only re-stamps the
// timer/secrets/videoPlayback; each player's own template watches that same
// timer node and clears its OWN answer in response (a write it's always
// allowed to make), which is how e.g. SortOrder's player component re-arms
// itself after a reset.
export async function resetPhase(sessionId: string, phase: Phase) {
  requireHostUid()
  await openPhase(sessionId, phase)
}

// endLevel: modular flow. Called from the host when a played phase is done.
// Flushes durable results (once), marks the phase as played, then either
// returns to the picker anchor (idle) or auto-ends the session if every
// non-idle phase in phaseOrder is now played.
export async function endLevel(sessionId: string, currentPhaseId: string) {
  const b = bundle()
  const current = b.phases[currentPhaseId]
  if (!current) return
  if (current.type === 'idle') return // nothing to flush on the picker anchor

  try {
    await flushPhaseResults(sessionId, current)
  } catch (e) {
    console.error('flushPhaseResults failed for', currentPhaseId, e)
  }
  await set(eref(`sessions/${sessionId}/played/${currentPhaseId}`), true)

  const played = await readPlayedPhases(sessionId)
  const playable = b.phaseOrder.filter((id) => b.phases[id]?.type !== 'idle')
  const allPlayed = playable.length > 0 && playable.every((id) => played[id])

  if (allPlayed) {
    await endSession(sessionId, { flushCurrent: false })
    return { done: true as const }
  }

  const anchor = pickerAnchorId()
  const hostUid = requireHostUid()
  const pointer: PhasePointer = {
    activePhaseId: anchor,
    changedAt: Date.now(),
    changedBy: hostUid,
  }
  await update(eref(`sessions/${sessionId}`), { phasePointer: pointer })
  await openPhase(sessionId, b.phases[anchor])
  return { done: false as const }
}

// endSession: host-triggered terminal exit. Optional flushCurrent flushes the
// active non-idle phase before ending (default true — safe for manual end from
// mid-level; endLevel calls with false because it just flushed).
export async function endSession(
  sessionId: string,
  opts: { flushCurrent?: boolean } = { flushCurrent: true }
) {
  if (opts.flushCurrent) {
    const pointerSnap = await get(eref(`sessions/${sessionId}/phasePointer`))
    const activeId = (pointerSnap.val() as PhasePointer | null)?.activePhaseId
    const active = activeId ? bundle().phases[activeId] : undefined
    if (active && active.type !== 'idle') {
      try {
        await flushPhaseResults(sessionId, active)
      } catch (e) {
        console.error('flushPhaseResults failed on endSession for', activeId, e)
      }
    }
  }
  await Promise.all([
    update(eref(`sessions/${sessionId}/meta`), { status: 'ended' }),
    remove(eref(`sessions/${sessionId}/timer`)),
  ])
}
