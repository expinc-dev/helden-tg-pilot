import { PlayerWaitScreen } from '@/components/PlayerWaitScreen'

import { useMyTeamId, useTeams } from '@/lib/sync/useTeams'

// Passive screen shown to a player during mid-session idle (e.g. host is
// picking the next level). Figma "Idle": app bar + "Lihat Layar Utama!", team
// pill only when this session has team mode on and a team assigned.
export function PlayerIdleScreen({
  sessionId,
  playerId,
  allowTeams,
}: {
  sessionId: string
  playerId: string | undefined
  allowTeams: boolean | undefined
}) {
  const myTeamId = useMyTeamId(sessionId, playerId ?? '')
  const teams = useTeams(sessionId)
  const myTeam = myTeamId ? teams.find((t) => t.id === myTeamId) : undefined
  const teamName = allowTeams && myTeam?.teamName ? myTeam.teamName : undefined

  return <PlayerWaitScreen message="Lihat Layar Utama!" teamName={teamName} />
}
