import { useState } from 'react'

import { assets } from '@/assets'
import { GradientButton } from '@/components/GradientButton'
import { HostBadge } from '@/pages/host/_shared/HostBadge'
import type { MicrolearningContent } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { useGameType } from '@/lib/sync/useGameType'
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
  const done = Math.min(step, total - 1) + 1
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
  title,
  sessionId,
  onAdvance,
}: {
  content: MicrolearningContent
  title: string
  sessionId: string
  onAdvance?: () => void
}) {
  const { players } = usePresence(sessionId)
  const teams = useTeams(sessionId)
  const gameType = useGameType()
  const total = content.steps.length
  const entries = Object.entries(players) as [
    string,
    (typeof players)[string] & { selfStep?: number },
  ][]
  const [openTeamId, setOpenTeamId] = useState<string | null>(null)

  const teamRows: TeamRowData[] = teams.map((t) => {
    const members = entries.filter(([, p]) => p.teamId === t.id)
    const leaderStep = members.find(([id]) => id === t.ownerPlayerId)?.[1].selfStep ?? 0
    return {
      id: t.id,
      name: t.teamName ?? t.id,
      memberCount: t.memberCount,
      pct: progressPct(leaderStep, total),
      members: members.map(([id, p]) => ({
        id,
        name: p.name,
        step: Math.min(leaderStep, total - 1) + 1,
      })),
      total,
    }
  })
  const openTeam = teamRows.find((t) => t.id === openTeamId)

  return (
    <div
      className="flex min-h-dvh flex-col bg-cover bg-top p-4 sm:p-6"
      style={{ backgroundImage: `url(${assets.images.backgrounds.auth})` }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border p-4 sm:p-6"
        style={{ borderColor: '#353535', background: 'rgba(8, 8, 8, 0.20)' }}
      >
        <HostBadge pageName={gameType} />
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-xs text-white/40">
            Pantau seluruh progress pemain secara real-time
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
          {gameType === 'Multiplayer Game'
            ? teamRows.map((t) => (
                <TeamProgressRow key={t.id} team={t} onOpen={() => setOpenTeamId(t.id)} />
              ))
            : entries.map(([id, p]) => (
                <PlayerProgressRow
                  key={id}
                  name={p.name}
                  pct={progressPct(p.selfStep ?? 0, total)}
                  connected={p.connected}
                />
              ))}
        </div>

        {onAdvance && (
          <GradientButton type="button" onClick={onAdvance} className="w-full py-3.5 text-sm">
            Akhiri Level
          </GradientButton>
        )}
      </div>

      {openTeam && <TeamDetailModal team={openTeam} onClose={() => setOpenTeamId(null)} />}
    </div>
  )
}

// Absolute status, not a proportional arc: green once fully done, red once
// clearly falling behind, gold in between — a host scanning the list should
// be able to spot a stuck player by color alone.
function badgeColor(pct: number): string {
  if (pct >= 100) return '#22C55E'
  if (pct >= 50) return '#FFB800'
  return '#EF4444'
}

function ProgressBadge({ pct }: { pct: number }) {
  const color = badgeColor(pct)
  return (
    <span
      className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
      style={{ borderColor: color, color }}
    >
      {pct}%
    </span>
  )
}

// Row card style per design spec: rounded-lg (8px), #353535 border, black 64%.
function RowCard({
  children,
  onClick,
  connected = true,
}: {
  children: React.ReactNode
  onClick?: () => void
  connected?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left ${connected ? '' : 'opacity-40'}`}
      style={{ borderColor: '#353535', background: 'rgba(0, 0, 0, 0.64)' }}
    >
      {children}
    </Tag>
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
    <RowCard connected={connected}>
      <span className="flex items-center gap-2 text-sm text-white/90">
        <Icon icon="mdi:account-circle-outline" className="size-5 text-white/50" />
        {name}
      </span>
      <ProgressBadge pct={pct} />
    </RowCard>
  )
}

// Tapping a team row opens TeamDetailModal (a popup) rather than expanding
// inline — the member list format differs (member step, not connection dot).
function TeamProgressRow({ team, onOpen }: { team: TeamRowData; onOpen: () => void }) {
  return (
    <RowCard onClick={onOpen}>
      <span className="flex items-center gap-2 text-sm text-white/90">
        <Icon icon="mdi:account-group" className="size-5 text-white/50" />
        Tim {team.name}
        <span className="text-white/40">({team.memberCount} Pemain)</span>
      </span>
      <ProgressBadge pct={team.pct} />
    </RowCard>
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
          <ProgressBadge pct={team.pct} />
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
