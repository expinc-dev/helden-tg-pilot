import type { Phase } from '@helden-inc/tg-schema'

import { type TeamRole, useTeamRole } from '@/lib/sync/useTeamRole'

import { TeamCodeInput } from './CodeInput'
import { IdleRenderer } from './Idle'
import { MicrolearningRenderer } from './Microlearning'
import { PresentationRenderer } from './Presentation'
import { QuizRenderer } from './Quiz'
import { TeamFocusLeader } from './TeamFocusLeader'
import { VideoRenderer } from './Video'
import { UnknownTemplate } from './minigames/UnknownTemplate'
import { minigameRegistry } from './minigames/registry'

export type Role = 'host' | 'central' | 'player'

type RouterProps = {
  phase: Phase
  phaseStartMs?: number
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
  return <PhaseContentSwitch {...props} teamRole="solo" />
}

function PlayerPhaseGate(props: RouterProps & { playerId: string }) {
  const teamRole = useTeamRole(props.sessionId, props.playerId, props.phase)
  if (props.phase.teamMode === 'team_leader_only' && teamRole === 'member') {
    return <TeamFocusLeader phaseId={props.phase.id} />
  }
  return <PhaseContentSwitch {...props} teamRole={teamRole} />
}

// Discriminate on phase.content (the real discriminated union). phase.type is a
// plain enum, independent of content in the schema — switching on it does not
// narrow content, so we switch on content.type and pass the narrowed content down.
function PhaseContentSwitch({
  phase,
  phaseStartMs,
  role,
  sessionId,
  playerId,
  allowTeams,
  teamId,
  teamRole,
}: RouterProps & { teamRole: TeamRole }) {
  const content = phase.content
  switch (content.type) {
    case 'idle':
      return <IdleRenderer content={content} role={role} phaseId={phase.id} />
    case 'codeinput':
      // Team-aware page: only in team mode. Otherwise fall through to the
      // "not renderable yet" default (single-player codeinput isn't built).
      return allowTeams ? (
        <TeamCodeInput
          phase={phase}
          phaseStartMs={phaseStartMs}
          sessionId={sessionId}
          role={role}
          teamId={teamId}
        />
      ) : (
        <div className="p-8 text-sm text-gray-500">Code input needs Team Mode enabled.</div>
      )
    case 'video':
      return (
        <VideoRenderer
          content={content}
          role={role}
          sessionId={sessionId}
          title={phase.title}
          playerId={playerId}
          allowTeams={allowTeams}
        />
      )
    case 'presentation':
      return (
        <PresentationRenderer
          content={content}
          role={role}
          sessionId={sessionId}
          phaseId={phase.id}
        />
      )
    case 'quiz':
      return (
        <QuizRenderer
          content={content}
          role={role}
          sessionId={sessionId}
          phaseId={phase.id}
          playerId={playerId}
          teamId={teamId}
          phase={phase}
        />
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
    case 'minigame': {
      // Registry lookup (BLUEPRINT_runtime §9). Unknown templateId OR invalid
      // config → safe fallback. The template's Zod schema validates the loose
      // `config: Record<string, unknown>` that tg-schema keeps intentionally open.
      const template = minigameRegistry.get(content.templateId)
      if (!template) {
        return <UnknownTemplate templateId={content.templateId} reason="not registered" />
      }
      const parsed = template.configSchema.safeParse(content.config)
      if (!parsed.success) {
        return <UnknownTemplate templateId={content.templateId} reason="invalid config" />
      }
      const Renderer = template.Renderer
      return (
        <Renderer
          config={parsed.data}
          phase={phase}
          sessionId={sessionId}
          playerId={playerId}
          role={role}
          teamRole={teamRole}
        />
      )
    }
    default:
      return (
        <div className="p-8 text-sm text-gray-500">
          Phase type "{content.type}" not renderable yet.
        </div>
      )
  }
}
