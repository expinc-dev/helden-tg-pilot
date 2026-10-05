import { useState } from 'react'

import { HostPanelHeader } from '@/pages/host/_shared/HostScreenFrame'
import { Icon } from '@iconify/react'

import { usePresence } from '@/lib/sync/useSession'
import { useTeams } from '@/lib/sync/useTeams'

import type { ReflectionContent, ReflectionRow } from '../lib'
import { useReflectionStats } from '../lib'

// Host's monitor pane (Figma "Panel Kontrol Refleksi"): two stat tiles, then
// the connected teams — each expands to its members' reflections. Individual
// sessions (no teams) fall back to one flat list of players.
export function HostReflection({
  content,
  sessionId,
  phaseId,
}: {
  content: ReflectionContent
  sessionId: string
  phaseId: string
}) {
  const { rows, answered, avgScale } = useReflectionStats(sessionId, phaseId)
  const { players } = usePresence(sessionId)
  const teams = useTeams(sessionId)
  const completion = rows.length ? Math.round((answered.length / rows.length) * 100) : 0

  const grouped = teams
    .map((t) => ({
      id: t.id,
      name: t.teamName ?? t.id,
      rows: rows.filter((r) => (players[r.id] as { teamId?: string } | undefined)?.teamId === t.id),
    }))
    .filter((g) => g.rows.length > 0)

  return (
    <div className="flex min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#353535_transparent] flex-col gap-12 overflow-y-auto px-8 pt-10 pb-8">
      <HostPanelHeader
        badge={null}
        title="Panel Kontrol Refleksi"
        subtitle="Pantau hasil refleksi setiap tim dan lihat perkembangan diskusi secara real-time."
      />

      <div className="grid grid-cols-2 gap-4">
        <Stat label="Pemain" value={`${answered.length}/${rows.length}`} />
        <Stat
          label={avgScale !== null ? 'Rata-rata skala' : 'Completion'}
          value={avgScale !== null ? `${avgScale}/${content.scale.max}` : `${completion}%`}
        />
      </div>

      <div className="flex flex-col gap-8 rounded-lg border border-[#353535] bg-black/[0.08] p-6">
        <p className="text-base tracking-[-0.04em] text-white [text-shadow:0_0_12px_rgba(253,164,0,0.2)]">
          {grouped.length > 0 ? 'Tim Terhubung' : 'Pemain Terhubung'}
        </p>
        <div className="flex flex-col divide-y divide-[#404040] rounded border border-[#404040] bg-[#0e0e0e]">
          {rows.length === 0 && <p className="p-4 text-sm text-white/40">Belum ada pemain.</p>}
          {grouped.length > 0
            ? grouped.map((g) => <TeamBlock key={g.id} name={g.name} rows={g.rows} />)
            : rows.map((r) => <Quote key={r.id} row={r} flat />)}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded border border-[#353535] p-4">
      <span className="text-base tracking-[-0.04em] text-[#fddb00] [text-shadow:0_0_12px_rgba(253,164,0,0.2)]">
        {label}
      </span>
      <span className="text-[32px] leading-[1.2] font-bold text-white">{value}</span>
    </div>
  )
}

function TeamBlock({ name, rows }: { name: string; rows: ReflectionRow[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between p-4 text-left text-base tracking-[-0.04em] text-[#a2a2a2]"
      >
        <span className="flex items-center gap-4">
          <Icon icon="material-symbols:group-outline-rounded" className="size-4 text-[#fddb00]" />
          {name}
        </span>
        <span className="flex items-center gap-2">
          {rows.length} Pemain
          <Icon
            icon="mdi:chevron-right"
            className={`size-4 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 bg-white/[0.04] px-4 pb-4">
          {rows.map((r) => (
            <Quote key={r.id} row={r} />
          ))}
        </div>
      )}
    </div>
  )
}

function Quote({ row, flat }: { row: ReflectionRow; flat?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${flat ? 'p-4' : 'pt-3'}`}>
      <p className="flex items-center gap-2 text-sm tracking-[-0.04em] text-[#a2a2a2]">
        <span
          className={`inline-block size-2 rounded-full ${row.connected ? 'bg-green-500' : 'bg-gray-500'}`}
        />
        {row.name}
        {row.answer && <span className="text-[#fddb00]">{row.answer.scale}</span>}
      </p>
      <p className="text-xs leading-snug text-white/60">
        {row.answer ? `“${row.answer.text}”` : 'Belum menjawab'}
      </p>
    </div>
  )
}
