import { PlayerWaitScreen } from '@/components/PlayerWaitScreen'

// Shown once a player has successfully joined (and, in team mode, picked a
// team) but the host hasn't started the session yet. The team pill only
// renders when this session actually has team mode on and a team assigned —
// solo sessions never show team text here.
export function PlayerWaitingScreen({ teamName }: { teamName?: string }) {
  return <PlayerWaitScreen message="Menunggu Dimulai.." teamName={teamName} />
}
