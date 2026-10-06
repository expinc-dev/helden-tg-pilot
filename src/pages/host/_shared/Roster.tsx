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
    <div
      className={`flex flex-col items-center justify-end gap-2 rounded border border-[#353535] py-3 sm:py-4 ${
        onCopy
          ? 'min-w-0 flex-1 px-4 sm:flex-none sm:shrink-0 sm:px-8'
          : 'min-w-0 flex-1 px-3 sm:px-4'
      }`}
    >
      <span className="text-helden-yellow text-center text-sm tracking-[-0.04em] [text-shadow:0_0_12px_rgba(253,164,0,0.2)]">
        {label}
      </span>
      <span className="flex items-center gap-2 text-2xl leading-[1.2] font-bold text-white sm:text-[32px]">
        {value}
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="text-helden-yellow hover:text-helden-yellow/80"
            aria-label={`Salin ${label}`}
          >
            <Icon icon="mdi:content-copy" className="size-6" />
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
    <div className="flex flex-col divide-y divide-[#404040] rounded border border-[#404040] bg-[#0e0e0e]">
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
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between p-4 text-left text-base tracking-[-0.04em] text-[#a2a2a2]"
      >
        <span className="flex items-center gap-4">
          <Icon icon="material-symbols:group-outline-rounded" className="size-4" />
          {name}
        </span>
        <span className="flex items-center gap-2">
          <span>{rows.length} Pemain</span>
          <Icon
            icon="mdi:chevron-right"
            className={`size-4 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </span>
      </button>
      {open && (
        <ul className="flex flex-col gap-1 border-t border-[#404040] bg-black/40 px-4 py-2">
          {rows.map(([id, p]) => (
            <li
              key={id}
              className="flex items-center justify-between py-2 text-base tracking-[-0.04em] text-[#a2a2a2]"
            >
              <span className="flex items-center gap-4">
                <Icon icon="material-symbols:account-circle-outline" className="size-4" />
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
    <ul className="flex flex-col divide-y divide-[#404040] rounded border border-[#404040] bg-[#0e0e0e]">
      {players.map(([id, p]) => (
        <li
          key={id}
          className="flex items-center justify-between p-4 text-base tracking-[-0.04em] text-[#a2a2a2]"
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
