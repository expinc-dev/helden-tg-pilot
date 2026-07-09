import type { Team } from '@helden-inc/tg-schema'
import { get, ref, runTransaction, serverTimestamp, set, update } from 'firebase/database'

import { rtdb } from '@/lib/firebase'
import { newId } from '@/lib/ids'

import { addMember } from './teamroster'

// Team Mode helpers. FLAT structure: every device stays a normal players/{id}.
// A team's roster is the authoritative memberIds[] on the team node; player.teamId
// points back to it. maxMembers is enforced by a transaction on memberIds[],
// exactly like maxPlayers is enforced on the players collection.

export type JoinTeamResult = { ok: true } | { ok: false; reason: 'full' }

export async function createTeam(
  sessionId: string,
  ownerPlayerId: string,
  teamName: string
): Promise<string> {
  const teamId = newId('t')
  const team: Omit<Team, 'codeinput'> = {
    ownerPlayerId,
    memberIds: [ownerPlayerId], // owner is member #1; always fits
    createdAt: Date.now(),
    ...(teamName.trim() ? { teamName: teamName.trim() } : {}),
  }
  await set(ref(rtdb, `sessions/${sessionId}/teams/${teamId}`), team)
  await update(ref(rtdb, `sessions/${sessionId}/players/${ownerPlayerId}`), {
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
  const cfg = await get(ref(rtdb, `sessions/${sessionId}/config`))
  const max = (cfg.val()?.maxMembers as number | undefined) ?? Infinity

  const tx = await runTransaction(
    ref(rtdb, `sessions/${sessionId}/teams/${teamId}/memberIds`),
    (members: string[] | null) => addMember(members, playerId, max)
  )
  if (!tx.committed) return { ok: false, reason: 'full' }

  await update(ref(rtdb, `sessions/${sessionId}/players/${playerId}`), {
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
