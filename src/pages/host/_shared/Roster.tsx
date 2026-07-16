import { useState } from 'react'

import type { PlayerPresence } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

// Shared team/player roster list + stat tile, used by both the pre-session
// Lobby and the mid-session host idle screen — same "who's connected" view,
// different surrounding chrome.

export function StatTile({
  label,
  value,
  onCopy,
}: {
  label: string
  value: string
  onCopy?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/5 bg-[#0A0A0A] p-3 sm:p-4">
      <span className="text-helden-yellow text-base font-medium">{label}</span>
      <span className="flex items-center gap-2 text-lg font-bold text-white sm:text-2xl">
        {value}
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="text-helden-yellow hover:text-helden-yellow/80"
            aria-label={`Salin ${label}`}
          >
            <Icon icon="mdi:content-copy" className="size-4" />
          </button>
        )}
      </span>
    </div>
  )
}

export function TeamList({
  players,
  teams,
}: {
  players: [string, PlayerPresence][]
  teams: { id: string; teamName?: string; memberCount: number }[]
}) {
  const teamName = new Map(teams.map((t) => [t.id, t.teamName]))
  const grouped = new Map<string, [string, PlayerPresence][]>()
  for (const entry of players) {
    const key = entry[1].teamId ?? '__unassigned__'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(entry)
  }
  const sections = [...grouped.entries()].sort(([a], [b]) =>
    a === '__unassigned__' ? 1 : b === '__unassigned__' ? -1 : a.localeCompare(b)
  )
  if (sections.length === 0) {
    return <p className="px-1 text-xs text-white/50">Belum ada tim.</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {sections.map(([teamId, rows]) => (
        <TeamRow
          key={teamId}
          name={teamId === '__unassigned__' ? 'Unassigned' : (teamName.get(teamId) ?? teamId)}
          rows={rows}
        />
      ))}
    </div>
  )
}

function TeamRow({ name, rows }: { name: string; rows: [string, PlayerPresence][] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-[#1C1C1E]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm text-white/90 sm:text-base"
      >
        <span className="flex items-center gap-2">
          <Icon icon="mdi:account-group" className="size-4 text-white/60" />
          {name}
        </span>
        <span className="flex items-center gap-2 text-white/60">
          <span>{rows.length} Pemain</span>
          <Icon
            icon="mdi:chevron-right"
            className={`size-4 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </span>
      </button>
      {open && (
        <ul className="flex flex-col gap-1 border-t border-white/5 px-2 py-2">
          {rows.map(([id, p]) => (
            <li
              key={id}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-white/90"
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:account-circle-outline" className="size-4 text-white/60" />
                {p.name}
              </span>
              <StatusDot connected={p.connected} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function PlayerRows({ players }: { players: [string, PlayerPresence][] }) {
  return (
    <ul className="space-y-1">
      {players.map(([id, p]) => (
        <li
          key={id}
          className="flex items-center justify-between rounded-md bg-[#1C1C1E] px-3 py-2 text-sm text-white/90"
        >
          <span>{p.name}</span>
          <StatusDot connected={p.connected} />
        </li>
      ))}
    </ul>
  )
}

export function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      title={connected ? 'connected' : 'offline'}
      className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-500'}`}
    />
  )
}
