import { SessionEnd } from '@/components/SessionEnd'

// Rendered when meta.status === 'ended' — the same closing screen every role
// sees at the end of the authored End phase (components/SessionEnd): podium and
// ranked list from the boundary-flushed aggregate maps, plus the viewing
// player's own result. The per-phase breakdown lives in
// sessions/{id}/results/ or /teamResults/ if a dashboard ever needs it.
export function EndScreen({
  sessionId,
  role,
  playerId,
  teamId,
}: {
  sessionId: string
  role: 'host' | 'central' | 'player'
  playerId?: string
  teamId?: string
}) {
  return <SessionEnd role={role} sessionId={sessionId} playerId={playerId} teamId={teamId} />
}
