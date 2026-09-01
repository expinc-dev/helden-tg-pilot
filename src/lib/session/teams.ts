import type { Team } from '@helden-inc/tg-schema'
import { get, serverTimestamp, set, update } from 'firebase/database'

import { eref } from '@/lib/firebase'
import { newId } from '@/lib/ids'

import { addMember } from './teamroster'

// Team Mode helpers. FLAT structure: every device stays a normal players/{id}.
// A team's roster is the authoritative memberIds map on the team node (playerId
// -> true, tg-schema 2.0.0); player.teamId points back to it. maxMembers is
// enforced by reading memberIds and deciding before writing — same read-then-
// decide tradeoff as joinPresence's capacity check (see its comment): a
// transaction on the whole memberIds map re-validates every existing member's
// ownership rule on rerun, which fails once the team already has a member.

export type JoinTeamResult = { ok: true } | { ok: false; reason: 'full' }

export async function createTeam(
  sessionId: string,
  ownerPlayerId: string,
  teamName: string
): Promise<string> {
  const teamId = newId('t')

  // Two sequential writes, not one set() of the whole node — a rules engine
  // check against `newData.child('ownerPlayerId')` while evaluating a single
  // combined write proved unreliable in practice. Write ownerPlayerId ALONE
  // first, targeting that exact leaf directly (simple, already-confident rule:
  // "!data.exists() && you own the playerId you're naming as owner"). Once
  // that's committed, every other field's rule can check it via root.child(),
  // reading ALREADY-persisted data instead of introspecting a value mid-write.
  await set(eref(`sessions/${sessionId}/teams/${teamId}/ownerPlayerId`), ownerPlayerId)

  const rest: Omit<Team, 'codeinput' | 'ownerPlayerId'> = {
    memberIds: { [ownerPlayerId]: true }, // owner is member #1; always fits
    createdAt: Date.now(),
    ...(teamName.trim() ? { teamName: teamName.trim() } : {}),
  }
  await update(eref(`sessions/${sessionId}/teams/${teamId}`), rest)

  await update(eref(`sessions/${sessionId}/players/${ownerPlayerId}`), {
    teamId,
    lastSeen: serverTimestamp(),
  })
  return teamId
}

export async function joinTeam(
  sessionId: string,
  playerId: string,
  teamId: string
): Promise<JoinTeamResult> {
  // Roster cap; missing config → no cap (fail-open, nothing authored).
  const cfg = await get(eref(`sessions/${sessionId}/config`))
  const max = (cfg.val()?.maxMembers as number | undefined) ?? Infinity

  const membersSnap = await get(eref(`sessions/${sessionId}/teams/${teamId}/memberIds`))
  const reserved = addMember(membersSnap.val() as Record<string, true> | null, playerId, max)
  if (!reserved) return { ok: false, reason: 'full' }

  // Write only this player's own child — rules scope memberIds/$memberPlayerId
  // to auth.uid === owner-or-self, so this never touches (or re-validates) any
  // other member's entry.
  await set(eref(`sessions/${sessionId}/teams/${teamId}/memberIds/${playerId}`), true)

  await update(eref(`sessions/${sessionId}/players/${playerId}`), {
    teamId,
    lastSeen: serverTimestamp(),
  })
  return { ok: true }
}

// Deep-link a teammate scans (rendered as a QR by react-qr-code). Carries the
// session join code + teamId so JoinGate routes straight into this team.
export function teamInviteUrl(joinCode: string, teamId: string): string {
  const base = window.location.origin
  return `${base}/join/player?code=${encodeURIComponent(joinCode)}&team=${encodeURIComponent(teamId)}`
}
