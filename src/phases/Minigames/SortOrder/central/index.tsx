import { assets } from '@/assets'
import type { Phase } from '@helden-inc/tg-schema'
import { Icon } from '@iconify/react'

import { useTeams } from '@/lib/sync/useTeams'

import { useTeamSubmissions } from '../lib'

export function CentralSortOrder({ sessionId, phase }: { sessionId: string; phase: Phase }) {
  const teams = useTeams(sessionId)
  const submitted = useTeamSubmissions(sessionId, teams, phase.id)
  const submittedCount = teams.filter((t) => submitted[t.id]).length

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 p-8"
      style={{
        backgroundImage: `url(${assets.images.backgrounds.central})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Icon icon="mdi:sort" className="size-16 text-[#FFB800]" />
      <h1 className="max-w-4xl text-center text-4xl leading-tight font-bold text-white drop-shadow-lg">
        {phase.title}
      </h1>
      <p className="text-xl text-white/50">Setiap tim menyusun urutan langkahnya sendiri...</p>
      <div className="rounded-full bg-white/10 px-6 py-2 text-2xl font-bold text-[#FFB800]">
        {submittedCount} / {teams.length} tim selesai
      </div>
    </div>
  )
}
