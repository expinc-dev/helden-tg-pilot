import type { TeamMode } from '@helden-inc/tg-schema'

import type { TeamRole } from './useTeamRole'

// Pure resolver: which playerId's selfStep should this device read/write, and is
// it allowed to write? Answers the ticket's open question — teamMode overrides
// syncMode's per-player stepping ONLY for a team_leader_only MEMBER: they mirror
// the leader's own selfStep instead of having one, because in that mode only the
// leader acts at all. team_collaborative members still act on their own step —
// "collaborative" means everyone participates, teamMode there only changes where
// the RESULT/score attributes (playerId vs teamId, handled in tg-schema), not
// whether this device can advance. Solo/leader/any lockstep phase: untouched.
export type StepTarget = { targetPlayerId: string | undefined; canWrite: boolean }

export function resolveStepTarget(
  myPlayerId: string | undefined,
  role: TeamRole,
  leaderId: string | undefined,
  teamMode: TeamMode | undefined
): StepTarget {
  if (role === 'member' && teamMode === 'team_leader_only') {
    return { targetPlayerId: leaderId, canWrite: false }
  }
  return { targetPlayerId: myPlayerId, canWrite: true }
}
