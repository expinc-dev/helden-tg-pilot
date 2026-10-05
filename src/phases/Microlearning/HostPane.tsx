import { useState } from 'react'

import { HostNextPhaseButton } from '@/pages/host/_shared/HostNextPhaseButton'
import { HostScreenFrame } from '@/pages/host/_shared/HostScreenFrame'
import { PlayerLabel, ProgressRing, ProgressRow, TeamLabel } from '@/pages/host/_shared/ProgressRow'
import type { MicrolearningContent } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { useGameType } from '@/lib/sync/useGameType'
import { readSelfStep } from '@/lib/sync/usePlayerStep'
import { usePresence } from '@/lib/sync/useSession'
import { useTeams } from '@/lib/sync/useTeams'

// ─── Host: real-time roster, grouped by team when Team Mode is on ───────────
//
// Individual sessions: one row per player. Team Mode: one row per TEAM,
// expandable to each member — this matters because in team_leader_only mode a
// member's OWN selfStep never gets written (only the leader's does, per
// resolveStepTarget), so a flat per-player list would wrongly show every
// member stuck at 0%. The team's progress is the leader's step; each member
// row mirrors that same step, matching what they'd actually see on screen.

function progressPct(step: number, total: number): number {
  // Completed steps, not pointer+1: a fresh player (selfStep 0) is at 0%, and
  // the finish sentinel (selfStep === total) saturates at 100%.
  const done = Math.min(Math.max(step, 0), total)
  return Math.round((done / total) * 100)
}

type TeamRowData = {
  id: string
  name: string
  memberCount: number
  pct: number
  members: { id: string; name: string; step: number }[]
  total: number
}

export function MonitorPane({
  content,
  sessionId,
  phaseId,
  onAdvance,
}: {
  content: MicrolearningContent
  title?: string
  sessionId: string
  phaseId: string
  onAdvance?: () => void
}) {
  const { players } = usePresence(sessionId)
  const teams = useTeams(sessionId)
  const gameType = useGameType()
  const total = content.steps.length
  const entries = Object.entries(players) as [
    string,
    (typeof players)[string] & { selfStep?: unknown },
  ][]
  const [openTeamId, setOpenTeamId] = useState<string | null>(null)

  const teamRows: TeamRowData[] = teams.map((t) => {
    const members = entries.filter(([, p]) => p.teamId === t.id)
    const leaderStep = readSelfStep(
      members.find(([id]) => id === t.ownerPlayerId)?.[1].selfStep,
      phaseId
    )
    return {
      id: t.id,
      name: t.teamName ?? t.id,
      memberCount: t.memberCount,
      pct: progressPct(leaderStep, total),
      members: members.map(([id, p]) => ({
        id,
        name: p.name,
        step: Math.min(Math.max(leaderStep, 0), total),
      })),
      total,
    }
  })
  const openTeam = teamRows.find((t) => t.id === openTeamId)
  // Solo testing / pre-team lobby in a teams-on session: no teams exist yet,
  // so a teams-only list would render empty ("tidak muncul"). Fall back to
  // per-player rows until the first team appears.
  const showTeams = gameType === 'Multiplayer Game' && teamRows.length > 0

  return (
    <HostScreenFrame
      badge={gameType}
      title="Progres Tim"
      subtitle="Pantau seluruh progress pemain secara real-time"
      bodyClassName="gap-4"
      footer={
        onAdvance && (
          <HostNextPhaseButton
            onConfirm={onAdvance}
            className="h-16 w-full shrink-0 text-lg font-medium! tracking-[-0.04em]"
          />
        )
      }
    >
      {showTeams
        ? teamRows.map((t) => (
            <TeamProgressRow key={t.id} team={t} onOpen={() => setOpenTeamId(t.id)} />
          ))
        : entries.map(([id, p]) => (
            <PlayerProgressRow
              key={id}
              name={p.name}
              pct={progressPct(readSelfStep(p.selfStep, phaseId), total)}
              connected={p.connected}
            />
          ))}
      {openTeam && <TeamDetailModal team={openTeam} onClose={() => setOpenTeamId(null)} />}
    </HostScreenFrame>
  )
}

function PlayerProgressRow({
  name,
  pct,
  connected,
}: {
  name: string
  pct: number
  connected: boolean
}) {
  return (
    <ProgressRow pct={pct} dim={!connected}>
      <PlayerLabel name={name} />
    </ProgressRow>
  )
}

// Tapping a team row opens TeamDetailModal (a popup) rather than expanding
// inline — the member list format differs (member step, not connection dot).
function TeamProgressRow({ team, onOpen }: { team: TeamRowData; onOpen: () => void }) {
  return (
    <ProgressRow pct={team.pct} onClick={onOpen}>
      <TeamLabel name={team.name} count={team.memberCount} />
    </ProgressRow>
  )
}

function TeamDetailModal({ team, onClose }: { team: TeamRowData; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-lg border"
        style={{ borderColor: '#353535', background: 'rgba(0, 0, 0, 0.64)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 p-4">
          <span className="flex items-center gap-2 text-sm text-white/90">
            <Icon icon="mdi:account-group" className="size-5 text-white/50" />
            Tim {team.name}
            <span className="text-white/40">({team.memberCount} Pemain)</span>
          </span>
          <ProgressRing pct={team.pct} />
        </div>
        <div className="flex flex-col gap-1.5 px-3 pb-3">
          {team.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-white/80"
              style={{ background: 'rgba(255, 255, 255, 0.04)' }}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:account-circle-outline" className="size-4 text-white/40" />
                {m.name}
              </span>
              <span className="text-xs text-white/50">
                Tahap {m.step} dari {team.total}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
