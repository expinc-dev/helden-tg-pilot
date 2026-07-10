import type { Phase } from '@helden-inc/tg-schema'

import { useTeamRole } from '@/sync/useTeamRole'

import { TeamCodeInput } from './CodeInput'
import { IdleRenderer } from './Idle'
import { MicrolearningRenderer } from './Microlearning'
import { TeamFocusLeader } from './TeamFocusLeader'

export type Role = 'host' | 'central' | 'player'

type RouterProps = {
  phase: Phase
  role: Role
  sessionId: string
  playerId?: string
  allowTeams?: boolean
  teamId?: string
}

// Top-level entry. Player role only, and only here: resolve team role ONCE and
// gate on it before any phase-type renderer ever mounts — a team_leader_only
// member never sees an input UI, on first load OR after reconnect (BLUEPRINT_runtime
// §7 extension), regardless of which phase type is active or added later. Host/
// central never have a team role (teams are made of players), so they skip
// straight to the normal switch.
export function PhaseRouter(props: RouterProps) {
  if (props.role === 'player' && props.playerId) {
    return <PlayerPhaseGate {...props} playerId={props.playerId} />
  }
  return <PhaseContentSwitch {...props} />
}

function PlayerPhaseGate(props: RouterProps & { playerId: string }) {
  const teamRole = useTeamRole(props.sessionId, props.playerId, props.phase)
  if (props.phase.teamMode === 'team_leader_only' && teamRole === 'member') {
    return <TeamFocusLeader phaseId={props.phase.id} />
  }
  return <PhaseContentSwitch {...props} />
}

// Discriminate on phase.content (the real discriminated union). phase.type is a
// plain enum, independent of content in the schema — switching on it does not
// narrow content, so we switch on content.type and pass the narrowed content down.
function PhaseContentSwitch({ phase, role, sessionId, playerId, allowTeams, teamId }: RouterProps) {
  const content = phase.content
  switch (content.type) {
    case 'idle':
      return <IdleRenderer content={content} role={role} phaseId={phase.id} />
    case 'codeinput':
      // Team-aware page: only in team mode. Otherwise fall through to the
      // "not renderable yet" default (single-player codeinput isn't built).
      return allowTeams ? (
        <TeamCodeInput
          content={content}
          phaseId={phase.id}
          sessionId={sessionId}
          role={role}
          teamId={teamId}
        />
      ) : (
        <div className="p-8 text-sm text-gray-500">Code input needs Team Mode enabled.</div>
      )
    case 'microlearning':
      return (
        <MicrolearningRenderer
          content={content}
          title={phase.title}
          role={role}
          sessionId={sessionId}
          playerId={playerId}
          phase={phase}
        />
      )
    default:
      return (
        <div className="p-8 text-sm text-gray-500">
          Phase type "{content.type}" not renderable yet.
        </div>
      )
  }
}
