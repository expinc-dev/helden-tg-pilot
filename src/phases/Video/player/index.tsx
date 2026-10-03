import { PlayerWaitScreen } from '@/components/PlayerWaitScreen'

import { useMyTeamId, useTeams } from '@/lib/sync/useTeams'

// Player side of a video phase: the video plays on the central screen, so the
// phone just says to look there (same wait screen as idle).
export function PlayerFoldIn({
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
