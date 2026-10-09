// Pure step / progress maths for the self-paced microlearning monitors (host
// "Progres Tim" and the central wall). No Firebase —
// `checks/phases/microlearning/progress.selfcheck.ts` runs it under `npx tsx`.
//
// Who actually works depends on the phase's team mode:
//  - team_leader_only: only the team leader acts; members just watch, so their own
//    selfStep is never written (always 0) and must NOT be counted as "at step 0".
//  - individual / team_collaborative: every player works on their own step, even
//    inside a team — a team is only as far along as its members are.

export type StepPlayer = { id: string; selfStep: number }

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)

/** True when only the team leaders work in this phase (and teams exist). */
export function leaderOnly(teamMode: string | undefined, leaderIds: string[]): boolean {
  return teamMode === 'team_leader_only' && leaderIds.length > 0
}

/**
 * The step the central wall follows: where most WORKING players are. A tie goes to
 * the later step (the room is moving on; sticking to the intro step hid the
 * question while half the room was already answering). Nobody working -> step 0.
 */
export function pickCentralStep(o: {
  players: StepPlayer[]
  total: number
  teamMode?: string
  leaderIds: string[]
}): number {
  const only = leaderOnly(o.teamMode, o.leaderIds)
  const working = only ? o.players.filter((p) => o.leaderIds.includes(p.id)) : o.players
  const counts = new Map<number, number>()
  for (const p of working) {
    const s = clamp(p.selfStep, 0, Math.max(o.total - 1, 0))
    counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  let step = 0
  let best = 0
  for (const [s, n] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
    if (n >= best) {
      best = n
      step = s
    }
  }
  return step
}

/** Players that finished / players that should finish, for the "76%" overall screen. */
export function roomProgress(o: {
  players: StepPlayer[]
  total: number
  joined: number
  teamMode?: string
  leaderIds: string[]
}): { finished: number; roomSize: number } {
  const only = leaderOnly(o.teamMode, o.leaderIds)
  const working = only ? o.players.filter((p) => o.leaderIds.includes(p.id)) : o.players
  const finished = working.filter((p) => p.selfStep >= o.total).length
  const base = only ? o.leaderIds.length : o.joined
  return { finished, roomSize: Math.max(base, finished) }
}

export type TeamMemberProgress = { id: string; step: number | null; role: 'leader' | 'member' }

/**
 * Progress of one team for the host. Leader-only: the leader's step is the team's
 * and members are shown as watching (step = null). Otherwise each member's own
 * step counts and the team is the average, so one finished leader never marks
 * the whole team done.
 */
export function teamProgress(o: {
  teamMode?: string
  total: number
  leaderId?: string
  members: StepPlayer[]
}): { pct: number; members: TeamMemberProgress[] } {
  const pctOf = (step: number) => Math.round((clamp(step, 0, o.total) / Math.max(o.total, 1)) * 100)
  const role = (id: string): 'leader' | 'member' => (id === o.leaderId ? 'leader' : 'member')
  if (o.teamMode === 'team_leader_only') {
    const leader = o.members.find((m) => m.id === o.leaderId)
    return {
      pct: pctOf(leader?.selfStep ?? 0),
      members: o.members.map((m) => ({
        id: m.id,
        role: role(m.id),
        step: m.id === o.leaderId ? clamp(m.selfStep, 0, o.total) : null,
      })),
    }
  }
  const pcts = o.members.map((m) => pctOf(m.selfStep))
  return {
    pct: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0,
    members: o.members.map((m) => ({
      id: m.id,
      role: role(m.id),
      step: clamp(m.selfStep, 0, o.total),
    })),
  }
}
