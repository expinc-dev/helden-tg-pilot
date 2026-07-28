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
import { auth, rtdb } from '@/lib/firebase'

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
  const node = ref(rtdb, `sessions/${sessionId}/timer`)
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
// Quiz answer keys — kept here (host-only call site) so they never leak via
// the phase content that every client imports from demoBundle. The keys map
// phaseId → questionIndex → correctOptionId.
// Exported for HostQuiz's reveal — the host reads the key from here directly
// (rules keep secrets/* read-denied for everyone; only .validate compares it).
export const quizAnswerKeys: Record<string, Record<number, string>> = {
  'p-quiz': {
    0: 'b',
    1: 'c',
    2: 'b',
    3: 'a',
    4: 'c',
  },
}

async function openPhaseSecrets(sessionId: string, phase: Phase | undefined) {
  if (!phase) return
  if (phase.content.type === 'codeinput') {
    const { expected, caseSensitive } = phase.content
    await set(
      ref(rtdb, `sessions/${sessionId}/secrets/${phase.id}`),
      normalizeCode(expected, caseSensitive)
    )
  } else if (phase.content.type === 'quiz' && quizAnswerKeys[phase.id]) {
    await set(ref(rtdb, `sessions/${sessionId}/secrets/${phase.id}`), quizAnswerKeys[phase.id])
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
  const snap = await get(ref(rtdb, `sessions/${sessionId}/played`))
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
  const node = ref(rtdb, `sessions/${sessionId}/videoPlayback`)
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
    get(ref(rtdb, `sessions/${sessionId}/players`)),
    get(ref(rtdb, `sessions/${sessionId}/teams`)),
    get(ref(rtdb, `sessions/${sessionId}/config`)),
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
    if (Object.keys(patch).length > 0) await update(ref(rtdb, `sessions/${sessionId}`), patch)
    return
  }

  const order = Object.keys(players).sort(byJoinedAt)
  await set(ref(rtdb, `sessions/${sessionId}/codepiece/${phase.id}/fragmentOrder`), order)
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
    remove(ref(rtdb, `sessions/${sessionId}/centralStep`)),
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
  await update(ref(rtdb, `sessions/${sessionId}`), {
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
  }
  if (!next) {
    // Last phase done → end the session. Flush already ran above; timer cleared
    // so useTimer doesn't show a stale phase deadline on the end screen.
    await Promise.all([
      update(ref(rtdb, `sessions/${sessionId}/meta`), { status: 'ended' }),
      remove(ref(rtdb, `sessions/${sessionId}/timer`)),
    ])
    return { done: true as const }
  }
  const pointer: PhasePointer = { activePhaseId: next, changedAt: Date.now(), changedBy: hostUid }
  await update(ref(rtdb, `sessions/${sessionId}`), { phasePointer: pointer })
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
  await update(ref(rtdb, `sessions/${sessionId}`), { phasePointer: pointer })
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
  await set(ref(rtdb, `sessions/${sessionId}/played/${currentPhaseId}`), true)

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
  await update(ref(rtdb, `sessions/${sessionId}`), { phasePointer: pointer })
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
    const pointerSnap = await get(ref(rtdb, `sessions/${sessionId}/phasePointer`))
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
    update(ref(rtdb, `sessions/${sessionId}/meta`), { status: 'ended' }),
    remove(ref(rtdb, `sessions/${sessionId}/timer`)),
  ])
}
