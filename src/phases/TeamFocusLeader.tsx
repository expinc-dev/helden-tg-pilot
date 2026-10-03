import { PlayerWaitScreen } from '@/components/PlayerWaitScreen'

import { useMyTeamId, useTeams } from '@/lib/sync/useTeams'

// team_leader_only, rendered for a "member": no input UI at all — only the
// leader acts in this mode, so a member's device should not show the phase's
// own renderer (BLUEPRINT_runtime §7 extension: reconnect must land a member
// back on THIS, not stuck on stale local state or an interactive control they
// can't use). Mirrors Idle's PlayerIdleScreen visual language on purpose —
// this IS an idle state for this device, just phase-specific in its caption.
// Self-contained background (not just a color) since several of this
// component's callers (codeinput, minigames) bypass the page shell's own
// background to own their full screen — this can't rely on an ambient one.
export function TeamFocusLeader({ sessionId, playerId }: { sessionId: string; playerId?: string }) {
  // Show the team's name (never a raw id); no pill while it is loading/unnamed.
  const teamId = useMyTeamId(sessionId, playerId ?? '')
  const teams = useTeams(sessionId)
  const teamName = teams.find((t) => t.id === teamId)?.teamName?.trim() || undefined
  return <PlayerWaitScreen message="Lihat Layar Pemimpin Tim" teamName={teamName} />
}
